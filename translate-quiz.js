const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'yahia', 'Downloads', 'html-quiz-app-final', 'data', 'quizzes.json');
const quizzes = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

// Deep English Translation Mapping for Quizzes
const translated = quizzes.map(q => {
    // Basic mapping objects
    let enQ = '';
    let enC = [];
    let enC_A = '';
    let enE = '';

    if (q.question.includes('<!DOCTYPE')) {
        enQ = 'What is the purpose of the <!DOCTYPE html> declaration?';
        enC = [
            'Defining the website title.',
            'Telling the browser the document is HTML5.',
            'Adding CSS files.',
            'Saving data to the server.'
        ];
        enC_A = 'Telling the browser the document is HTML5.';
        enE = 'DOCTYPE informs the browser of the HTML standard used to ensure correct rendering.';
    } else if (q.question.includes('<title>')) {
        enQ = 'Which tag sets the page title in the browser tab?';
        enC = ['<head> tag.', '<body> tag.', '<title> tag.', '<header> tag.'];
        enC_A = '<title> tag.';
        enE = 'The <title> tag displays its text in the browser tab or title bar.';
    } else if (q.question.includes('CSS الخارج')) {
        enQ = 'Where are external CSS file links placed?';
        enC = ['Inside the <body> tag.', 'Inside the <head> tag.', 'At the end of the page.', 'Between paragraphs.'];
        enC_A = 'Inside the <head> tag.';
        enE = 'Metadata and external links like CSS are placed in the <head>.';
    } else if (q.question.includes('lang في وسم')) {
        enQ = 'What is the function of the lang attribute in the <html> tag?';
        enC = [
            'Changing font color.',
            'Specifying content language to assist search engines and screen readers.',
            'Adding hidden links.',
            'Refreshing the browser automatically.'
        ];
        enC_A = 'Specifying content language to assist search engines and screen readers.';
        enE = 'Helps browsers and search engines identify the primary language of the website.';
    } else if (q.question.includes('روابط التنقل')) {
        enQ = 'Which element is used to contain the main navigation links?';
        enC = ['<section> tag.', '<nav> tag.', '<aside> tag.', '<ul> tag.'];
        enC_A = '<nav> tag.';
        enE = 'nav is short for Navigation and is used for navigation links.';
    } else if (q.question.includes('محتوى جانبي')) {
        enQ = 'The most appropriate tag to represent a Sidebar?';
        enC = ['<section> tag.', '<nav> tag.', '<aside> tag.', '<article> tag.'];
        enC_A = '<aside> tag.';
        enE = 'aside is used for content indirectly related to the main content.';
    } else if (q.question.includes('لمقال مستقل')) {
        enQ = 'Tag for a self-contained article that can be republished?';
        enC = ['<div> tag.', '<article> tag.', '<section> tag.', '<main> tag.'];
        enC_A = '<article> tag.';
        enE = 'article represents independent content like a blog post or news story.';
    } else if (q.question.includes('الجوهر')) {
        enQ = 'What is the fundamental difference between <div> and <section>?';
        enC = [
            'There is no difference.',
            '<div> is a generic container, while <section> represents a thematic part.',
            '<div> loads faster.',
            '<section> is used strictly for images.'
        ];
        enC_A = '<div> is a generic container, while <section> represents a thematic part.';
        enE = 'div has no semantic meaning, while section divides the page into logical regions.';
    } else if (q.question.includes('إرسال البيانات')) {
        enQ = 'Which attribute specifies how data is sent (GET/POST)?';
        enC = ['action attribute', 'target attribute', 'method attribute', 'name attribute'];
        enC_A = 'method attribute';
        enE = 'method determines the HTTP submission protocol for the form.';
    } else if (q.question.includes('إجباريا')) {
        enQ = 'Which attribute makes an input field required?';
        enC = ['autofocus attribute', 'required attribute', 'disabled attribute', 'hidden attribute'];
        enC_A = 'required attribute';
        enE = 'required prevents form submission before filling the demanded field.';
    } else if (q.question.includes('placeholder')) {
        enQ = 'What is the function of the placeholder attribute?';
        enC = [
            'Saving value to the database.',
            'Displaying faint hint text that disappears when typing.',
            'Changing input language.',
            'Setting the font type.'
        ];
        enC_A = 'Displaying faint hint text that disappears when typing.';
        enE = 'It provides a hint to the user regarding what to input.';
    } else if (q.question.includes('قائمة منسدلة')) {
        enQ = 'Which tag is used to create a dropdown list?';
        enC = ['<input> tag.', '<select> tag.', '<datalist> tag.', '<drop> tag.'];
        enC_A = '<select> tag.';
        enE = 'select along with option is used to build dropdown menus.';
    } else if (q.question.includes('checkbox')) {
        enQ = 'What is the difference between checkbox and radio?';
        enC = [
            'No difference.',
            'Checkbox is for multiple choices, Radio is for a single choice only.',
            'Radio is for long texts.',
            'Checkbox changes page color.'
        ];
        enC_A = 'Checkbox is for multiple choices, Radio is for a single choice only.';
        enE = 'Radio enforces a single choice within the same name group.';
    } else if (q.question.includes('رأس') && q.question.includes('للعمود')) {
        enQ = 'Which tag defines a cell as a column header?';
        enC = ['<td> tag.', '<th> tag.', '<tr> tag.', '<thead> tag.'];
        enC_A = '<th> tag.';
        enE = 'th stands for Table Header, appearing bold and centered by default.';
    } else if (q.question.includes('دمج الصفوف')) {
        enQ = 'Which attribute spans a cell across multiple rows?';
        enC = ['colspan attribute', 'rowspan attribute', 'span attribute', 'height attribute'];
        enC_A = 'rowspan attribute';
        enE = 'rowspan extends a cell across more than one row vertically.';
    } else if (q.question.includes('autoplay')) {
        enQ = 'What does the autoplay attribute do in a video?';
        enC = [
            'Loops the video.',
            'The video starts playing automatically when the page loads.',
            'Mutes the video.',
            'Maximizes the screen size.'
        ];
        enC_A = 'The video starts playing automatically when the page loads.';
        enE = 'It makes the video start immediately without needing to press play.';
    } else if (q.question.includes('نسبي')) {
        enQ = 'What does the relative path ../image.png signify?';
        enC = [
            'The image is in the current directory.',
            'The image is in the parent directory of the current one.',
            'The image is on an external server.',
            'The path is invalid.'
        ];
        enC_A = 'The image is in the parent directory of the current one.';
        enE = '.. means going one directory up in the file tree structure.';
    } else if (q.question.includes('CSS') && q.question.includes('ربط')) {
        enQ = 'Which tag is used to link an external CSS file?';
        enC = [
            '<link rel="stylesheet" href="style.css">',
            '<script src="style.css">',
            '<style src="style.css">',
            '<import path="style.css">'
        ];
        enC_A = '<link rel="stylesheet" href="style.css">';
        enE = 'The link tag connects external resources like stylesheets to the page.';
    } else if (q.question.includes('نهاية') && q.question.includes('script')) {
        enQ = 'Why is it preferred to place the <script> tag at the end of the <body>?';
        enC = [
            'To keep the code hidden.',
            'To ensure HTML elements load first before executing scripts.',
            'To make the code run faster.',
            'Because placing it at the top always causes an error.'
        ];
        enC_A = 'To ensure HTML elements load first before executing scripts.';
        enE = 'Improves user UX by allowing the page content to appear faster before loading Javascript.';
    } else if (q.question.includes('title') && q.question.includes('الغرض')) {
        enQ = 'What is the purpose of the title attribute on links or paragraphs?';
        enC = [
            'Changing the link color.',
            'Displaying a tooltip when hovering over the element.',
            'Opening the link in a new tab.',
            'Writing the developers name.'
        ];
        enC_A = 'Displaying a tooltip when hovering over the element.';
        enE = 'title provides extra information that shows up when hovering the cursor over it.';
    } else {
        enQ = q.question;
        enC = q.choices;
        enC_A = q.correctAnswer;
        enE = q.explanation;
    }

    // Explicitly stripping trailing periods from correct answers for strict matching
    const stripDot = str => str.replace(/\.$/, '').trim();

    // Map choices to objects
    const bilingualChoices = q.choices.map((arChoice, i) => {
        return {
            ar: stripDot(arChoice),
            en: stripDot(enC[i])
        };
    });

    return {
        question: { ar: q.question, en: enQ },
        choices: bilingualChoices,
        correctAnswer: { ar: stripDot(q.correctAnswer), en: stripDot(enC_A) },
        explanation: { ar: q.explanation, en: enE },
        category: q.category, // already English
        sessionNumber: q.sessionNumber
    };
});

fs.writeFileSync(targetPath, JSON.stringify(translated, null, 4), 'utf8');
console.log('Quizzes effectively translated and transformed into {ar, en} schema.');
