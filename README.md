# ChatGPT Desktop RTL Patch for Hebrew (Codex & OWL)

A drop-in RTL patch for the **unified ChatGPT desktop app** ("Powered by
Codex & OWL" - the app that merged ChatGPT Work and Codex) that improves
Hebrew and Arabic writing, mixed RTL/LTR text, punctuation alignment, and
keeps code blocks left-to-right.

תיקון RTL לאפליקציית **ChatGPT Desktop החדשה** (המאוחדת - Work + Codex)
שמשפר כתיבה בעברית ובערבית, טקסט מעורב עברית/אנגלית, יישור סימני פיסוק
ושמירה על בלוקי קוד משמאל לימין.

> גרסאות קודמות של הפרויקט פיצ'ו את **Codex Desktop**. האפליקציה החדשה היא
> אותה חבילת חנות (`OpenAI.Codex`) עם מיתוג ChatGPT - הפאצ' תומך בשתיהן,
> ומשדרג אוטומטית התקנות ישנות של `Codex-RT-AI`.

By **RT-AI** - [rt-ai.co.il](https://rt-ai.co.il)

![Platform Windows](https://img.shields.io/badge/Windows-supported-blue) ![macOS experimental](https://img.shields.io/badge/macOS-experimental-lightgrey) ![Admin](https://img.shields.io/badge/admin-not_required-brightgreen) ![License MIT](https://img.shields.io/badge/license-MIT-green)

---
## Who is this for?

This project is for Hebrew and Arabic users of the unified ChatGPT desktop
app (the Codex & OWL one) who want natural RTL writing inside the app,
without changing their original installation.
מיועד למשתמשי עברית וערבית שעובדים עם אפליקציית ChatGPT Desktop החדשה
ורוצים כתיבה טבעית מימין לשמאל בתוך האפליקציה, בלי לשנות את ההתקנה המקורית.

## התקנה - שורה אחת

### Windows

פתחו **PowerShell** (לא חייב admin), הדביקו את השורה הזו, ולחצו Enter:

```powershell
irm https://raw.githubusercontent.com/rt25ai/chatgpt-desktop-rtl-rt-ai/v0.7.2/install-online.ps1 | iex
```

זהו. בסוף יופיע קיצור דרך בשם **"ChatGPT"** על שולחן העבודה ובתפריט Start,
והוא יפתח את הגרסה המפוצ'ת עם תמיכה ב-RTL. אם הייתה לכם התקנה ישנה של
**Codex-RT-AI** - היא תוסר ותוחלף אוטומטית.

> **דרישות:** [Node.js (LTS)](https://nodejs.org/) + אפליקציית ChatGPT
> (חבילת `OpenAI.Codex`) מ-Microsoft Store.
> לא נדרשים admin / takeown / שינויי הרשאות.

> **אם Windows מציג אזהרת אבטחה (`Trojan:Win32/ClickFix`):**
> זו **התרעת שווא (false positive)** - לא וירוס. Windows Defender מסמן כך כל
> פקודה מסוג `irm ... | iex` בגלל **צורת ההתקנה**, לא בגלל התוכן (הסיומת `!MTB`
> פירושה ניחוש היוריסטי, לא חתימה של נוזקה ידועה). הסקריפט פתוח לקריאה כאן
> ב-GitHub - הוא רק יוצר **עותק מקומי** של האפליקציה עם תמיכת עברית, בלי לגעת
> בהתקנה המקורית, ב-registry או ב-services. אם האזהרה קופצת: **Windows Security
> → היסטוריית הגנה → בחרו בפריט → "אפשר"**, ואז הריצו שוב את הפקודה.

### macOS - experimental

macOS support is included but has not yet been personally tested by the
author on the unified app. The script follows the standard pattern for
patching Electron apps on macOS (ad-hoc `codesign`, best-effort ASAR fuse)
and reuses the same payload as the Windows version. Confirmations, issue
reports and pull requests are very welcome.

פתחו **Terminal** והדביקו:

```bash
curl -fsSL https://raw.githubusercontent.com/rt25ai/chatgpt-desktop-rtl-rt-ai/v0.7.2/install-online.sh | bash
```

זה ייצור `~/Applications/ChatGPT-RT-AI.app` עם תמיכת RTL, מבלי לגעת
ב-`ChatGPT.app` המקורי תחת `/Applications` (או `Codex.app` בהתקנות ישנות -
שניהם מזוהים אוטומטית).

> **דרישות:** [Node.js](https://nodejs.org/) (`brew install node`) +
> Xcode CLI tools (`xcode-select --install`) + ChatGPT Desktop מותקן
> ב-`/Applications` (מ-https://chatgpt.com/download).
> שימו לב: **"ChatGPT Classic"** היא האפליקציה הישנה (Swift) - הפאצ' לא
> מיועד לה ולא ייגע בה.
> אם נתקלתם בבעיה - פתחו [issue](https://github.com/rt25ai/chatgpt-desktop-rtl-rt-ai/issues) או PR.

## Before / After

![Before and after RTL behavior in the ChatGPT desktop app](docs/rtl-before-after.png)

**מה משתנה בפועל:**

- לפני הפאצ': טקסט עברי יכול להיצמד לצד הלא נכון, סימני שאלה ופיסוק נראים
  הפוכים, ושורות מעורבות עברית/אנגלית מרגישות שבורות.
- אחרי הפאצ': הודעות בעברית מיושרות לימין, הפיסוק נשאר במקום הטבעי, ובלוקי
  קוד ממשיכים להופיע משמאל לימין כדי שלא יישברו.

**מה הפאצ' מזהה אוטומטית:**

- ✅ עברית/ערבית בתוך ה-composer → ה-input מיישר לימין בזמן הקלדה.
- ✅ עברית/ערבית בתשובות streaming מהמודל → כל פסקה מיושרת בנפרד לפי השפה.
- ✅ טקסט מעורב (עברית + אנגלית באותה שורה) → first-strong detection.
- ✅ בלוקי קוד (` ``` `, `<pre>`, Monaco, CodeMirror) → **תמיד LTR**.
- ✅ Inline code (`` `כך` ``) → LTR גם בתוך פסקה ב-RTL.
- ✅ סימני פיסוק "שמטיילים" - מיוצבים עם `unicode-bidi: plaintext`.

## הסרה / סטטוס

**Windows:**
```powershell
irm https://raw.githubusercontent.com/rt25ai/chatgpt-desktop-rtl-rt-ai/v0.7.2/uninstall-online.ps1 | iex
```

**macOS:**
```bash
curl -fsSL https://raw.githubusercontent.com/rt25ai/chatgpt-desktop-rtl-rt-ai/v0.7.2/uninstall-online.sh | bash
```

המקור (תחת `WindowsApps` ב-Windows, או `/Applications` ב-Mac)
**לא מושפע** וממשיך לעבוד רגיל. ההסרה מנקה גם שאריות של התקנות
`Codex-RT-AI` ישנות.

## עדכוני האפליקציה

כשהאפליקציה מתעדכנת (Microsoft Store ב-Windows / Sparkle ב-Mac), מותקנת
**משימת עדכון אוטומטית** שמפעילה את הפאצ' מחדש על הגרסה החדשה - בחלון
מוסתר, בלי לגעת בסשן פתוח. אין צורך להריץ שוב את המתקין; אם בכל זאת משהו
נתקע, הרצה חוזרת של שורת ההתקנה תמיד מיישרת את המצב.

**ההודעה "Updates Unavailable" בתוך האפליקציה צפויה.** בעותק המתוקן, "בדיקת
עדכונים" מציגה "Automatic updates are unavailable right now" עם
"updater initialization failed". מנגנון העדכון של ChatGPT ב-Windows עובד רק דרך
Microsoft Store, ודורש שהאפליקציה תרוץ מתוך החבילה המקורית שלה. העותק רץ מחוץ
לחבילה, ולכן המנגנון לא עולה. זה לא אומר שהעותק לא מתעדכן: ה-Store מעדכן את
המקור, והמשימה בונה מחדש את העותק כש-ChatGPT סגור. כדי לבדוק מאיזו גרסה העותק
נבנה ואם המשימה רשומה, מריצים את `status.bat`.

## תוקן: חלון CMD שקופץ (למי שהתקין גרסה קודמת)

אם התקנת **גרסה קודמת** והבחנת בחלון שחור (CMD/PowerShell) שקופץ כל כמה דקות -
זה היה באג במשימת העדכון האוטומטי: היא הופעלה אחרי **כל** עדכון Microsoft Store
ובחלון גלוי, במקום רק אחרי עדכון של האפליקציה. **תוקן.**

לא צריך להסיר ולהתקין מחדש - התקנת v0.7.2 (השורה הרגילה למעלה) מחליפה את
המשימה הישנה במשימה החדשה והנקייה. לחלופין, לתיקון המשימה בלבד:

```powershell
irm https://raw.githubusercontent.com/rt25ai/chatgpt-desktop-rtl-rt-ai/main/fix-autoupdate-online.ps1 | iex
```

---

## v0.7.2 - קריטי: "ChatGPT failed to start. The process has no package identity"

**אם ChatGPT המתוקן מפסיק להיפתח עם ההודעה הזו - הריצו את שורת ההתקנה שוב וזה
נפתר.**

מבילד **26.917** האפליקציה מגיעה עם דגל חדש, `codexWindowsAppContainedCore`,
שמריץ את הליבה בבידוד בתוך חבילת ה-Store. כשהדגל פעיל, האפליקציה מבקשת כבר
בהפעלה את זהות חבילת ה-MSIX שלה. לעותק המתוקן, שרץ מחוץ לחבילה, אין זהות כזו,
ולכן הוא נסגר מיד עם השגיאה. משימת העדכון האוטומטי בונה את העותק מחדש אחרי כל
עדכון של ה-Store, כך שזה פגע גם במי שלא עשה כלום.

**התיקון:** המתקין מכבה את הדגל בעותק, והאפליקציה חוזרת להריץ את הליבה שמגיעה
איתה, כמו בכל הבילדים שלפני 26.917. הדגל נקרא במקום אחד בלבד, בקוד ההפעלה.
נבדק על 26.917: העותק עולה, מתחבר לחשבון ומריץ את הליבה המצורפת.

## v0.7.1 - משימת העדכון האוטומטי לא נרשמה בלי הרשאות מנהל

**אם העותק המתוקן נשאר על גרסה ישנה, והרצתם בעבר את ההתקנה בלי לאשר את חלון
ה-UAC - הריצו את שורת ההתקנה שוב.**

אצל משתמש בלי הרשאות מנהל, רישום משימת העדכון האוטומטי נכשל עם
"Access is denied". הסיבה: טריגר הכניסה נרשם כ"כניסה של כל משתמש", ו-Windows
מאפשר רק למנהל לרשום טריגר כזה. גם הניסיון החלופי כלל את אותו טריגר ונכשל באותה
צורה. מי שלא אישר את חלון ה-UAC נשאר בלי משימה בכלל, והעותק הפסיק להתעדכן אחרי
עדכונים של ה-Store.

**התיקון:** טריגר הכניסה מוגבל עכשיו למשתמש הנוכחי. כך הוא נרשם בלי הרשאות מנהל
ובלי חלון UAC, בדיוק כמו הטריגר היומי. חלון ה-UAC נשאר רק למקרה ש-Windows חוסם
גם את זה.

> **תיקון למה שנכתב ב-v0.6.0:** לא כל משימה למשתמש בודד נחסמת. רק טריגר של
> "כניסה של כל משתמש" דורש הרשאות מנהל.

בנוסף, `status.bat` מציג עכשיו מאיזו גרסה העותק נבנה, ומזהיר כשהוא מפגר אחרי
הגרסה שב-Store.

## v0.7.0 - קריטי: האפליקציה לא נפתחה אחרי עדכון ל-26.901

**אם התקנתם גרסה קודמת ואחרי עדכון של ChatGPT האפליקציה המפוצ'ת מפסיקה
להיפתח - זה זה. הריצו את שורת ההתקנה שוב וזה נפתר.**

מבילד **26.901.1978.0** האפליקציה אוכפת **ASAR integrity**: ה-launcher נושא
בתוכו את ה-SHA-256 של ה-header של `app.asar`, ו-Electron מסרב לעלות אם הארכיון
על הדיסק מגיע לגיבוב אחר:

```
FATAL asar_util.cc:143 Integrity check failed for asar archive
  (5d404e81... vs 930e4a7a...)
```

כל פאץ' מחייב אריזה מחדש של `app.asar`, ואריזה מחדש תמיד משנה את הגיבוב - אז
העותק המפוצ' פשוט מת בהפעלה. בבילדים הקודמים האכיפה הזו לא הייתה קיימת, ולכן
הפאצ' עבד עד עכשיו.

**התיקון:** אחרי האריזה מחדש, המתקין מחשב את הגיבוב החדש של ה-header ומעדכן
אותו בתוך ה-launcher. הגיבוב שמור שם כמחרוזת hex רגילה באורך 64 תווים, אז זו
החלפה באותו אורך בדיוק - שום section לא זז ומבנה ה-PE לא משתנה. בבילד ישן
שלא מכיל את המחרוזת, השלב פשוט מדווח שאין מה לעדכן.

> **למה `@electron/fuses` לא פתר את זה:** ל-shell של ChatGPT אין fuse sentinel
> בכלל, אז אי אפשר לכבות את האכיפה - צריך לספק את הגיבוב הנכון.

## v0.6.0 - שם חדש והתקנה נקייה

**הריפו עבר שם:** `codex-rtl-rt-ai` → **`chatgpt-desktop-rtl-rt-ai`**. האפליקציה
כבר לא נקראת Codex אלא ChatGPT Desktop, והשם משקף את זה. GitHub שומר הפניה
מהשם הישן, כך ששורות התקנה ישנות ממשיכות לעבוד - אבל כדאי לעדכן לשורה החדשה.
גם קובץ ה-payload שונה ל-`chatgpt-rtl-payload.js`.

**ההתקנה עצמה נוקתה - היא מסיימת עכשיו בלי אף אזהרה:**

- **מוזרק קובץ אחד במקום 12.** קודם הפאצ' נדחף לכל bundle שהתאים ל-glob
  (`index-*.js`, `app-main-*.js`, `composer-*.js`). ה-payload ממילא מגן על
  עצמו בדגל גלובלי, אז 11 מתוך 12 ההזרקות רק ניפחו את האפליקציה. עכשיו
  המתקין קורא את ה-entry module מתוך `webview/index.html` ומזריק רק אליו.
- **נעלמה האזהרה על ה-ASAR fuse.** ל-shell של ChatGPT (OWL) פשוט אין fuse
  sentinel - זה תקין ולא בעיה, אז זו כבר לא אזהרה צהובה אלא שורת מידע.
- **חלון ה-UAC כבר לא מפתיע ולא נכשל בשקט.** רישום משימת העדכון האוטומטי
  דורש אישור מנהל אחד (כך Windows עובד - גם משימה למשתמש בלבד נחסמת).
  עכשיו נכתב מראש שהחלון עומד לקפוץ, ואם מסרבים - זו הודעת מידע רגילה עם
  הסבר מה זה אומר, לא שגיאה. הפאצ' עצמו מותקן ועובד בכל מקרה.
- אם המשימה כבר קיימת מהתקנה קודמת, המתקין מזהה ומדווח על כך במקום להיכשל.

## v0.5.0 - שורת הכלים העליונה שלא הגיבה ללחיצות

**זהו באג של האפליקציה עצמה, לא של הפאצ'** - הוא נמדד זהה בהתקנה נקייה
מה-Store, בלי שום פאץ'. הפאצ' פשוט מתקן אותו בדרך.

בבילד 26.831 האפליקציה פורשת מעל שורת הכלים כמה שכבות שנושאות גם
`-webkit-app-region: drag` וגם `pointer-events: none`. Chromium בונה את
אזור הגרירה של החלון מ-`-webkit-app-region` בלבד ו**מתעלם מ-`pointer-events`**,
ולכן Windows מדווח על כל הרצועה כ-`HTCAPTION` - כלומר "פס כותרת".

התוצאה: הפעמון, החיפוש ומחליף המצב Chat/Work/Codex יושבים בתוך הרצועה, ולחיצת
עכבר אמיתית עליהם **גוררת את החלון** במקום להגיע אליהם. מדידה עם
`WM_NCHITTEST` על אפליקציה מקורית לגמרי:

```
client y=10..20  -> HTCLIENT     שורת File/Edit/View - עובדת
client y=30..85  -> HTCAPTION    <-- הפעמון, החיפוש ו-ChatGPT
client y=90+     -> HTCLIENT     כל השאר עובד
```

**התיקון:** אלמנט שאינו יכול לקבל אירועי עכבר גם לא יכול לשמש ידית גרירה,
אז הפאצ' מנקה את אזור הגרירה רק על שכבות שהוכח שהן `pointer-events: none`.
ידית הגרירה האמיתית (שהיא interactive) נשארת - החלון עדיין נגרר משורת
התפריטים. אם OpenAI יתקנו את זה, שום אלמנט לא יתאים והקוד הופך ל-no-op.

אחרי התיקון, באותה מדידה: `y=44,60,76,90 -> HTCLIENT`, ושורת התפריטים
נשארה `HTCAPTION`.

## v0.4.0 - תיקון כפתורים שלא הגיבו ועיצוב שבור

בגרסאות עד `v0.3.0` הפאצ' היה כותב `dir="rtl"` על אלמנטים בתוך העמוד. זה
נראה תמים, אבל ה-UI של ChatGPT Desktop בנוי ב-Tailwind v4, וה-variant
בשם `rtl:` שלו מתקמפל לסלקטור כזה:

```css
.rtl\:end-4:where(:is(:lang(ar),…,:lang(he),…),[dir=rtl],[dir=rtl] *) { … }
```

כלומר `dir="rtl"` על אלמנט אחד מדליק את הכללים האלה על האלמנט **וכל
הצאצאים שלו**. בבילד הנוכחי יש 30 כללים כאלה (`flex-row-reverse`,
`rotate-180`, `translate-x-full`, `inset-inline-end`), ובנוסף דפדפן
ממפה `[dir=rtl]` ל-`direction:rtl` - מה שהופך עוד ~280 הצהרות של
logical properties (`padding-inline-*`, `margin-inline-*`, `inset-inline-*`).

התוצאה: שורות flex התהפכו, חצים הסתובבו ב-180°, ותפריטים, מתגים וכפתורים
זזו מהמקום שבו הם מצוירים - ולכן הקליקים "לא הגיבו".

**מה השתנה ב-v0.4.0:**

- הפאצ' **לעולם לא כותב `dir` או `lang`**. כיוון נקבע ב-CSS בלבד -
  ותכונת ה-CSS ‏`direction` לא מפעילה את `[dir=rtl]` ולא את `:dir(rtl)`,
  אז ה-variants של האפליקציה נשארים כבויים.
- היישור נעשה עם `unicode-bidi: plaintext`, שקובע כיוון בסיס לכל פסקה
  לפי התו החזק הראשון שלה. זו תכונה שאינה עוברת בירושה, ולכן היא משפיעה
  רק על הטקסט של האלמנט עצמו - בלי שום שינוי layout.
- הגיליון מוזרק כ-`@layer rt-ai-rtl` וכאלמנט הראשון ב-`<head>`, כך שהוא
  ה-layer החלש ביותר: הוא גובר רק על ברירות המחדל של הדפדפן, ומפסיד לכל
  כלל של האפליקציה. אין שום `!important`.
- ה-JavaScript היחיד שנשאר רק **מוסיף class** לפסקאות ורשימות בתוך תוכן
  ההודעות, לעולם לא inline-style ולא attribute, והוא מרוכז ב-frame אחד
  במקום לסרוק את כל ה-DOM בכל mutation.

הבדיקה ב-`tests/` מודדת כל אלמנט ב-chrome של האפליקציה עם הפאצ' ובלעדיו
ונכשלת אם משהו זז אפילו פיקסל אחד.

> אם התקנת גרסה קודמת - פשוט התקן מחדש עם השורה למעלה. אין צורך להסיר.

## איך זה עובד מבפנים

1. מוצא את האפליקציה תחת `C:\Program Files\WindowsApps\OpenAI.Codex_...\app`
   (זו חבילת ה-MSIX של ChatGPT המאוחדת - היא שמרה על מזהה Codex).
2. מעתיק אותה ל-`%LOCALAPPDATA%\Programs\ChatGPT-RT-AI`.
3. מחלץ את `resources\app.asar` עם `@electron/asar`.
4. מוסיף את `chatgpt-rtl-payload.js` כ-prefix ל-bundles של ה-webview:
   - `webview\assets\index-*.js`, `app-main-*.js`, `composer-*.js`
5. אורז מחדש את `app.asar`.
6. מנסה לכבות את `EnableEmbeddedAsarIntegrityValidation` (best-effort:
   בבניית ה-OWL החדשה אין fuse sentinel בכלל - וזה בסדר, היא לא אוכפת
   asar integrity).
7. כותב marker (`resources\rt-ai-chatgpt-rtl-patch.json`).
8. יוצר קיצורי דרך `ChatGPT.lnk` ב-Desktop וב-Start Menu (ומסיר קיצורי
   `Codex.lnk` ישנים).
9. רושם משימת עדכון אוטומטי שמפעילה re-patch אחרי עדכון Store.

הכל ב-`%LOCALAPPDATA%` - תיקייה user-writable. אין שינוי ב-`WindowsApps`,
ב-registry, או ב-services.

## מבנה הפרויקט

```text
.
|-- chatgpt-rtl-payload.js     # ה-JS שמוזרק ל-webview (משותף Win/Mac)
|--
|-- patch.ps1                # סקריפט ראשי - Windows
|-- install.bat              # מתקין בדאבל-קליק - Windows
|-- install-online.ps1       # מתקין one-liner - Windows
|-- uninstall.bat            # מסיר בדאבל-קליק - Windows
|-- uninstall-online.ps1     # מסיר one-liner - Windows
|-- status.bat               # סטטוס - Windows
|-- fix-autoupdate-online.ps1 # hotfix למשימת עדכון של גרסאות ישנות
|--
|-- patch.sh                 # סקריפט ראשי - macOS
|-- install-online.sh        # מתקין one-liner - macOS
|-- uninstall-online.sh      # מסיר one-liner - macOS
|--
|-- tests/verify-static.ps1  # בדיקות סטטיות
|-- tests/rtl-harness.html   # חיקוי של ה-webview עם הסלקטורים האמיתיים
|-- tests/run-rtl-harness.mjs # בדיקה התנהגותית - הפאצ' לא מזיז כלום
|-- README.md
|-- LICENSE
```

## ולידציה

בדיקות סטטיות (מבנה הסקריפטים, ה-invariants של ה-payload, פינים לגרסה):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tests\verify-static.ps1
```

בדיקה התנהגותית - טוענת את ה-payload לתוך חיקוי של ה-webview (עם
הסלקטורים האמיתיים של `rtl:` מהאפליקציה), מודדת כל אלמנט לפני ואחרי,
ונכשלת אם משהו ב-chrome זז, אם נכתב `dir`/`lang`, או אם טקסט RTL לא
מיושר נכון:

```powershell
node .\tests\run-rtl-harness.mjs
```

## Known limitations

- **The app has some RTL support of its own now.** Recent builds set
  `<html lang="he" dir="rtl">` when the app language is Hebrew, and put
  `dir="auto"` on conversation titles. Where the app already declares a
  direction this patch stays out of the way by design - it only supplies
  a direction where the app leaves one undecided. What it still adds:
  paragraphs that open with a Latin word but are Hebrew ("ChatGPT הוא
  כלי מצוין…"), list markers and quote bars on the correct side, code
  blocks pinned left-to-right, and per-line direction in the composer.
- **Mixed-language chrome labels are left alone.** A string like
  "…reset on 7 בספטמבר, 7:27" inside the app's own UI can still read out
  of order. Fixing that would mean overriding the direction of app
  chrome, which is exactly what broke v0.3.0, so the patch deliberately
  does not touch it.
- **macOS may need the same integrity fix, untested.** On Windows the
  launcher embeds the asar header hash and `patch.ps1` rewrites it (see
  v0.7.0 above). macOS stores the equivalent under `ElectronAsarIntegrity`
  in `Info.plist`, and `patch.sh` does not yet update it. If a patched
  `ChatGPT-RT-AI.app` refuses to launch after an app update, that is the
  likely cause - please open an issue.
- **macOS support is experimental** - the script follows a standard
  Electron-patching pattern, but the author has not personally tested it
  on the unified app.
- **The patched copy is not officially signed.** It carries an ad-hoc
  signature on macOS, and on Windows it is no longer MSIX-signed.
- **The copy runs the bundled codex core, not the app-contained one.** From
  build 26.917 the Store app can run its core app-contained, which requires
  the MSIX package identity; the patched copy has none and would not start
  (see v0.7.2 above). The patcher switches `codexWindowsAppContainedCore` off
  in the copy, which is how every build before 26.917 ran.
- **"Check for updates" inside the patched copy always says "Updates
  Unavailable" on Windows** ("updater initialization failed"). The app's
  Windows updater works through the Microsoft Store and needs the MSIX
  package identity, which a copy outside the package does not have. Updates
  still arrive: the Store updates the original and the auto-update task
  rebuilds the copy. `status.bat` shows whether the copy is behind.
- **Future UI changes** may move bundle filenames. The script will
  bail out with a clear error rather than patch the wrong file - report
  it as an issue and a new release will be cut.
- **Trust model:** the one-line installer is pinned to a signed release
  tag (currently `v0.7.2`), not the `main` branch. A compromised `main`
  cannot silently affect users who run the published one-liner. The repo
  is small and auditable - read the scripts before you run them.

---

## ⚠️ Disclaimer - הסרת אחריות

**אנא קראו לפני ההתקנה.**

- **שימוש אישי בלבד.** הכלי הזה מסופק כ-AS-IS, בלי שום אחריות מפורשת או
  משתמעת, וניתן לשימוש על אחריותו הבלעדית של המשתמש.
- **לא קשור ל-OpenAI.** הפאצ' אינו מוצר רשמי של OpenAI ואינו מאושר על-ידם.
  ChatGPT® ,Codex® ו-OpenAI® הם סימנים מסחריים של בעליהם.
- **מתקן העתק, לא את המקור.** הסקריפט יוצר העתק של האפליקציה תחת תיקיית
  המשתמש ומפעיל אותו. ההתקנה המקורית מ-Microsoft Store נשארת ללא שינוי.
  עם זאת, ההעתק כבר אינו חתום ב-MSIX integrity, מה שאומר ש-Windows לא
  מתייחס אליו כאל אפליקציה חתומה.
- **ASAR integrity fuse.** בבנייה הנוכחית (OWL) אין fuse בכלל; אם עתידית
  יהיה - הפאצ' מכבה אותו בהעתק כדי שיוכל לטעון את ה-asar המעודכן. השלכה:
  אם רוצים לחזור לחתימה מקורית - מסירים את ההעתק (`uninstall.bat`)
  ומשתמשים שוב במקור.
- **עדכונים מטופלים ע"י משימת ה-auto-update.** עדכון Store מעדכן את המקור;
  המשימה המתוזמנת מזהה זאת ומפצ'ת מחדש את ההעתק (כשהוא לא רץ). אפשר תמיד
  להריץ שוב את ההתקנה ידנית.
- **שימוש משפיע על your user data.** ההעתק חולק תיקיית user data עם המקור
  (אותו `UserDataDirectoryName`). זה אומר שכניסה, היסטוריית שיחות ופרטי
  משתמש אמורים להישמר.
- **ללא ערבות לתפקוד עתידי.** OpenAI יכולים בכל עת לשנות את מבנה ה-bundles
  הפנימי של האפליקציה. אם זה קורה - הפאצ' יעצור עם שגיאה ברורה (במקום
  לפגוע בקובץ הלא נכון בשקט), והוא ידרוש עדכון.
- **רישיון:** MIT. ראו [LICENSE](LICENSE). אין שום warranty (כולל לעניין
  merchantability ו-fitness for a particular purpose), והמחברים אינם
  אחראים לכל נזק ישיר, עקיף, מקרי, או תוצאתי שייגרם משימוש בכלי.

הוגן? לפני שמשתמשים, ודאו שאתם מבינים מה הסקריפט עושה. הקוד פתוח -
[קראו אותו](patch.ps1).

---

### English summary

Drop-in RTL (right-to-left) patch for the **unified ChatGPT desktop app**
("Powered by Codex & OWL" - MSIX package `OpenAI.Codex` on Windows,
`/Applications/ChatGPT.app` on macOS). Windows support is stable; macOS
support is experimental. Detects Hebrew/Arabic text in the composer and
streamed responses, aligns RTL content naturally, keeps code blocks LTR.
Existing Codex-RT-AI installs from older versions of this patcher are
migrated automatically.

**Install (one-liner, no admin):**

```powershell
# Windows (PowerShell)
irm https://raw.githubusercontent.com/rt25ai/chatgpt-desktop-rtl-rt-ai/v0.7.2/install-online.ps1 | iex
```

```bash
# macOS (Terminal) - untested on the unified app, contributions welcome
curl -fsSL https://raw.githubusercontent.com/rt25ai/chatgpt-desktop-rtl-rt-ai/v0.7.2/install-online.sh | bash
```

**Notes:**

- No admin / sudo required.
- The original app (under `WindowsApps` on Windows / `/Applications` on
  macOS) is left untouched. Only a copy under the user profile is patched.
- Shortcuts/launchers named "ChatGPT" point to the patched copy.
- An auto-update task re-applies the patch after the app updates.
- "ChatGPT Classic" (the old native app) is NOT a target of this patch.
- Personal use, AS-IS, MIT license. Not affiliated with OpenAI.

**Installed an earlier version and see a CMD window pop up every few minutes?**
That was an auto-update task bug (it fired on every Microsoft Store update, in a
visible window). Fixed - installing v0.7.2 replaces the old task. To fix just
the task (one UAC prompt):

```powershell
irm https://raw.githubusercontent.com/rt25ai/chatgpt-desktop-rtl-rt-ai/main/fix-autoupdate-online.ps1 | iex
```

## Known limitations

- macOS support is experimental.
- The patched copy is not an officially signed OpenAI app.
- On Windows, the in-app "Check for updates" shows "Updates Unavailable" in
  the patched copy. That is expected: updates come through the Store and the
  auto-update task.
- Future UI changes may require an update to this patch.
