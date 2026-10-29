#!/usr/bin/env python3
"""ממיר ייצוא סשן של Claude Code (transcript.jsonl) לתמלול Markdown קריא.

התמלול כולל, מילה במילה:
  * כל הודעות המשתמש (כולל טקסט שהודבק)
  * תשובות לשאלות הבחירה (AskUserQuestion)
  * כל הודעות הטקסט של ה־AI
קריאות לכלים (קבצים, פקודות, דפדפן) לא מועתקות. מוצג רק מספר הקריאות בכל תור.

שימוש:
  python3 scripts/transcript_to_md.py <transcript.jsonl> docs/ai-transcript/TRANSCRIPT.md
"""
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone, timedelta

IL = timezone(timedelta(hours=2))  # שעון ישראל, אוקטובר (אחרי סוף שעון הקיץ)


def ts(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(IL).strftime('%d.%m.%Y %H:%M')


def clean_user(text):
    text = re.sub(r'<pasted_content[^>]*>', '\n> **[טקסט שהודבק]**\n', text)
    text = re.sub(r'</pasted_content[^>]*>', '', text)
    return text.strip()


def main(src, dst):
    rows = [json.loads(line) for line in open(src, encoding='utf-8')]
    out = []
    turn = 0
    tools = Counter()
    awaiting_reply = False  # תמונה שצורפה להודעה נרשמת ביומן כהודעה נפרדת, ומאוחדת כאן לאותו תור

    def flush_tools():
        if tools:
            summary = ', '.join(f'{name} ×{n}' for name, n in tools.most_common())
            out.append(f'\n<sub>🔧 קריאות לכלים בתור הזה: {sum(tools.values())} ({summary})</sub>\n')
            tools.clear()

    for r in rows:
        kind = r.get('type')
        msg = r.get('message') or {}
        content = msg.get('content')
        if kind == 'user':
            if isinstance(content, str):
                texts, results = [content], []
            else:
                texts = [p.get('text', '') for p in content if isinstance(p, dict) and p.get('type') == 'text']
                results = [p for p in content if isinstance(p, dict) and p.get('type') == 'tool_result']
            # תשובות המשתמש לשאלות בחירה מגיעות כתוצאת כלי
            for res in results:
                body = res.get('content')
                body = ' '.join(b.get('text', '') for b in body) if isinstance(body, list) else str(body or '')
                if 'Your questions have been answered' in body or 'User has answered' in body:
                    out.append(f'\n**תשובות המשתמש לשאלות הבחירה:**\n\n> {body.strip()}\n')
            texts = [t for t in texts if t.strip() and not t.startswith('<system-reminder>')]
            if not texts:
                continue
            joined = '\n'.join(texts)
            if awaiting_reply and joined.lstrip().startswith('[Image'):  # תמונה שצורפה לאותה הודעה
                out.append(clean_user(joined) + '\n')
                continue
            flush_tools()
            turn += 1
            awaiting_reply = True
            out.append(f'\n---\n\n## תור {turn} · 👤 משתמש · {ts(r["timestamp"])}\n')
            out.append(clean_user('\n'.join(texts)) + '\n')
        elif kind == 'assistant' and isinstance(content, list):
            for p in content:
                if p.get('type') in ('text', 'tool_use'):
                    awaiting_reply = False
                if p.get('type') == 'text' and p.get('text', '').strip():
                    out.append(f'\n**🤖 Claude** · {ts(r["timestamp"])}\n\n{p["text"].strip()}\n')
                elif p.get('type') == 'tool_use':
                    name = p.get('name', '?')
                    tools[re.sub(r'^mcp__[^_]+(?:_[^_]+)*__', '', name) if name.startswith('mcp__') else name] += 1
    flush_tools()

    header = f"""# תמלול שיחת העבודה עם Claude Code

> **מקור:** ייצוא אוטומטי של הסשן מאפליקציית Claude Desktop (session export, `transcript.jsonl`), שהומר בסקריפט [`scripts/transcript_to_md.py`](../../scripts/transcript_to_md.py).
> **מה כלול:** כל הודעות המשתמש ותשובות ה־AI, **מילה במילה**. לא נערך דבר.
> **מה לא כלול:** פרטי הקריאות לכלים (עריכת קבצים, פקודות, צילומי מסך). בכל תור מוצג רק מספר הקריאות. הקוד עצמו נמצא בהיסטוריית ה־Git.
> **הערה:** הייצוא נעשה במהלך תור {turn}, ולכן התור האחרון מופיע חלקית.
> **קישורים:** בתשובות ה־AI הקישורים לקבצים נכתבו יחסית לתיקייה הראשית של הפרויקט, כפי שעבדו בצ'אט. כדי לשמור על נוסח מקורי הם לא שונו, ולכן מהתיקייה הזו הם לא עובדים בלחיצה. כל הקבצים נמצאים בפרויקט תחת אותם נתיבים.

**מספר תורות משתמש:** {turn}
"""
    open(dst, 'w', encoding='utf-8').write(header + ''.join(out))
    print(f'{turn} user turns → {dst}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
