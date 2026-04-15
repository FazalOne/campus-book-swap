const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const navStart = content.indexOf('<nav className="bg-primary shadow-md sticky top-0 z-50">');
if (navStart !== -1) {
    const replacement = \{["/", "/login", "/register"].includes(location.pathname) ? (
\t\t\t\t<div className="absolute top-4 right-4 z-50">
\t\t\t\t\t<div className="bg-primary rounded p-1 shadow-md">
\t\t\t\t\t\t<div className="flex bg-white/10 rounded overflow-hidden border border-white/20">
\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\tonClick={() => setLanguage("en")}
\t\t\t\t\t\t\t\tclassName={\\\px-2 py-1 text-sm font-bold \\\\\\}
\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\tEN
\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\tonClick={() => setLanguage("tr")}
\t\t\t\t\t\t\t\tclassName={\\\px-2 py-1 text-sm font-bold \\\\\\}
\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\tTR
\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t) : (
\t\t\t\t<nav className="bg-primary shadow-md sticky top-0 z-50">
\;
    content = content.replace('<nav className="bg-primary shadow-md sticky top-0 z-50">', replacement);
    
    // Find the closing nav tag, which corresponds to this nav tag
    // Since it's the main nav tag, it ends before \</nav>\n\n\t\t\t<main className="flex-grow">\
    content = content.replace('</nav>\\n\\n\\t\t\t<main className="flex-grow">', '</nav>\n\t\t\t)}\n\n\t\t\t<main className="flex-grow">');
}

// Fixed Logo block to replace
const targetStr = \<h1 className="text-4xl md:text-6xl font-extrabold text-primary mb-6">
\t\t\t\t\t{t("app.title")} 
\t\t\t\t</h1>\;
const newStr = \<h1 className="text-4xl md:text-6xl font-extrabold text-primary mb-6 flex items-center justify-center gap-4">
\t\t\t\t\t<BookOpenIcon className="w-12 h-12 md:w-16 md:h-16" />
\t\t\t\t\t{t("app.title")} 
\t\t\t\t</h1>\;

content = content.replace(targetStr, newStr);

fs.writeFileSync('App.tsx', content);

