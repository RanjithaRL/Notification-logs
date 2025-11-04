import React, { useState, useMemo } from 'react';

interface CodeBlockProps {
  code: string;
  language: 'sql' | 'json';
}

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);


const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const highlightedCode = useMemo(() => {
    let tempCode = code;
    if (language === 'sql') {
      const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'IN', 'AND', 'AS', 'ORDER BY', 'interval'];
      const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
      tempCode = tempCode.replace(regex, '<span class="text-pink-400">$1</span>');
      tempCode = tempCode.replace(/(\'.*?\')/g, '<span class="text-amber-300">$1</span>');
      tempCode = tempCode.replace(/(\b(count|date_trunc)\b)/g, '<span class="text-sky-300">$1</span>');
    } else if (language === 'json') {
      tempCode = tempCode.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
        if (/:$/.test(match)) {
          return `<span class="text-sky-300">${match}</span>`;
        }
        return `<span class="text-amber-300">${match}</span>`;
      });
       tempCode = tempCode.replace(/\b(true|false|null)\b/g, '<span class="text-pink-400">$1</span>');
       tempCode = tempCode.replace(/\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g, '<span class="text-teal-300">$1</span>');
    }
    return { __html: tempCode };
  }, [code, language]);

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-gray-700/50 rounded-md text-gray-400 hover:text-white hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy code"
      >
        {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
      </button>
      <pre className="bg-gray-900/70 p-4 rounded-lg overflow-x-auto text-sm border border-gray-700">
        <code className="font-mono" dangerouslySetInnerHTML={highlightedCode} />
      </pre>
    </div>
  );
};

export default CodeBlock;
