const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'yahia', 'Downloads', 'html-quiz-app-final', 'data', 'quizzes.json');
const quizzes = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

// Strict index-based translation mapping to overcome RTL string mismatches
const translations = [
    {
        enQ: 'What is the purpose of the <!DOCTYPE html> declaration?',
        enC: ['Defining the website title', 'Telling the browser the document is HTML5', 'Adding CSS files', 'Saving data to the server'],
        enC_A: 'Telling the browser the document is HTML5',
        enE: 'DOCTYPE informs the browser of the HTML standard used to ensure correct rendering.'
    },
    {
        enQ: 'Which tag sets the page title in the browser tab?',
        enC: ['The <head> tag', 'The <body> tag', 'The <title> tag', 'The <header> tag'],
        enC_A: 'The <title> tag',
        enE: 'The <title> tag displays its text in the browser tab or title bar.'
    },
    {
        enQ: 'Where are external CSS file links placed?',
        enC: ['Inside the <body> tag', 'Inside the <head> tag', 'At the end of the page', 'Between paragraphs'],
        enC_A: 'Inside the <head> tag',
        enE: 'Metadata and external links like CSS are placed in the <head>.'
    },
    {
        enQ: 'What is the function of the lang attribute in the <html> tag?',
        enC: ['Changing font color', 'Specifying content language to assist search engines and screen readers', 'Adding hidden links', 'Refreshing the browser automatically'],
        enC_A: 'Specifying content language to assist search engines and screen readers',
        enE: 'Helps browsers and search engines identify the primary language of the website.'
    },
    {
        enQ: 'Which element is used to contain the main navigation links?',
        enC: ['The <section> tag', 'The <nav> tag', 'The <aside> tag', 'The <ul> tag'],
        enC_A: 'The <nav> tag',
        enE: 'nav is short for Navigation and is used for navigation links.'
    },
    {
        enQ: 'The most appropriate tag to represent a Sidebar?',
        enC: ['The <section> tag', 'The <nav> tag', 'The <aside> tag', 'The <article> tag'],
        enC_A: 'The <aside> tag',
        enE: 'aside is used for content indirectly related to the main content.'
    },
    {
        enQ: 'Tag for a self-contained article that can be republished?',
        enC: ['The <div> tag', 'The <article> tag', 'The <section> tag', 'The <main> tag'],
        enC_A: 'The <article> tag',
        enE: 'article represents independent content like a blog post or news story.'
    },
    {
        enQ: 'What is the fundamental difference between <div> and <section>?',
        enC: ['There is no difference', '<div> is a generic container, while <section> represents a thematic part', '<div> loads faster', '<section> is used strictly for images'],
        enC_A: '<div> is a generic container, while <section> represents a thematic part',
        enE: 'div has no semantic meaning, while section divides the page into logical regions.'
    },
    {
        enQ: 'Which attribute specifies how data is sent (GET/POST)?',
        enC: ['action attribute', 'target attribute', 'method attribute', 'name attribute'],
        enC_A: 'method attribute',
        enE: 'method determines the HTTP submission protocol for the form.'
    },
    {
        enQ: 'Which attribute makes an input field required?',
        enC: ['autofocus attribute', 'required attribute', 'disabled attribute', 'hidden attribute'],
        enC_A: 'required attribute',
        enE: 'required prevents form submission before filling the demanded field.'
    },
    {
        enQ: 'What is the function of the placeholder attribute?',
        enC: ['Saving value to the database', 'Displaying faint hint text that disappears when typing', 'Changing input language', 'Setting the font type'],
        enC_A: 'Displaying faint hint text that disappears when typing',
        enE: 'It provides a hint to the user regarding what to input.'
    },
    {
        enQ: 'Which tag is used to create a dropdown list?',
        enC: ['The <input> tag', 'The <select> tag', 'The <datalist> tag', 'The <drop> tag'],
        enC_A: 'The <select> tag',
        enE: 'select along with option is used to build dropdown menus.'
    },
    {
        enQ: 'What is the difference between checkbox and radio?',
        enC: ['No difference', 'Checkbox is for multiple choices, Radio is for a single choice only', 'Radio is for long texts', 'Checkbox changes page color'],
        enC_A: 'Checkbox is for multiple choices, Radio is for a single choice only',
        enE: 'Radio enforces a single choice within the same name group.'
    },
    {
        enQ: 'Which tag defines a cell as a column header?',
        enC: ['The <td> tag', 'The <th> tag', 'The <tr> tag', 'The <thead> tag'],
        enC_A: 'The <th> tag',
        enE: 'th stands for Table Header, appearing bold and centered by default.'
    },
    {
        enQ: 'Which attribute spans a cell across multiple rows?',
        enC: ['colspan attribute', 'rowspan attribute', 'span attribute', 'height attribute'],
        enC_A: 'rowspan attribute',
        enE: 'rowspan extends a cell across more than one row vertically.'
    },
    {
        enQ: 'What does the autoplay attribute do in a video?',
        enC: ['Loops the video', 'The video starts playing automatically when the page loads', 'Mutes the video', 'Maximizes the screen size'],
        enC_A: 'The video starts playing automatically when the page loads',
        enE: 'It makes the video start immediately without needing to press play.'
    },
    {
        enQ: 'What does the relative path ../image.png signify?',
        enC: ['The image is in the current directory', 'The image is in the parent directory of the current one', 'The image is on an external server', 'The path is invalid'],
        enC_A: 'The image is in the parent directory of the current one',
        enE: '.. means going one directory up in the file tree structure.'
    },
    {
        enQ: 'Which tag is used to link an external CSS file?',
        enC: ['<link rel="stylesheet" href="style.css">', '<script src="style.css">', '<style src="style.css">', '<import path="style.css">'],
        enC_A: '<link rel="stylesheet" href="style.css">',
        enE: 'The link tag connects external resources like stylesheets to the page.'
    },
    {
        enQ: 'Why is it preferred to place the <script> tag at the end of the <body>?',
        enC: ['To keep the code hidden', 'To ensure HTML elements load first before executing scripts', 'To make the code run faster', 'Because placing it at the top always causes an error'],
        enC_A: 'To ensure HTML elements load first before executing scripts',
        enE: 'Improves user UX by allowing the page content to appear faster before loading Javascript.'
    },
    {
        enQ: 'What is the purpose of the title attribute on links or paragraphs?',
        enC: ['Changing the link color', 'Displaying a tooltip when hovering over the element', 'Opening the link in a new tab', 'Writing the developers name'],
        enC_A: 'Displaying a tooltip when hovering over the element',
        enE: 'title provides extra information that shows up when hovering the cursor over it.'
    }
];

// Helper to strip periods
const stripDot = str => typeof str === "string" ? str.replace(/\.$/, "").trim() : str;

const translated = quizzes.map((q, idx) => {
    const ts = translations[idx];

    // Safety check - handle if json is already in {ar,en} format from previous partial run
    const qAr = typeof q.question === "object" ? q.question.ar : q.question;
    const cAAr = typeof q.correctAnswer === "object" ? q.correctAnswer.ar : q.correctAnswer;
    const eAr = typeof q.explanation === "object" ? q.explanation.ar : q.explanation;

    const choiceArList = q.choices.map(c => typeof c === "object" ? c.ar : c);

    return {
        question: { ar: qAr, en: ts.enQ },
        choices: choiceArList.map((arChoice, i) => {
            return {
                ar: stripDot(arChoice),
                en: stripDot(ts.enC[i])
            };
        }),
        correctAnswer: { ar: stripDot(cAAr), en: stripDot(ts.enC_A) },
        explanation: { ar: eAr, en: ts.enE },
        category: q.category,
        sessionNumber: q.sessionNumber
    };
});

fs.writeFileSync(targetPath, JSON.stringify(translated, null, 4), 'utf8');
console.log('Quizzes effectively translated via strict index.');
