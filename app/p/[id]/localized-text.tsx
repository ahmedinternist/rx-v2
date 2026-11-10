import { Fragment } from 'react';

/** Annotate known scripts without changing whitespace, punctuation, or reading order. */
export default function LocalizedText({ text }: { text: string }) {
  return text.split(/([\p{Script=Arabic}\p{M}]+|[A-Za-z]+)/u).map((part, index) => {
    const lang = /\p{Script=Arabic}/u.test(part) ? 'ar' : /[A-Za-z]/.test(part) ? 'en' : undefined;
    return lang ? <span key={index} lang={lang}>{part}</span> : <Fragment key={index}>{part}</Fragment>;
  });
}
