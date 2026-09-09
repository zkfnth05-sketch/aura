import React from 'react';

interface FlagIconProps extends React.SVGProps<SVGSVGElement> {
  code?: string;
}

export function FlagIcon({ code, ...props }: FlagIconProps) {
  switch (code) {
    case 'ko':
      return (
        <svg viewBox="0 0 900 600" {...props}>
          <rect width="900" height="600" fill="#fff" />
          <g transform="translate(450,300)">
            <circle r="150" fill="#cd2e3a" />
            <path d="M0-150a150 150 0 0 0 0 300 75 75 0 0 1 0-150 75 75 0 0 1 0 150" fill="#0047a0" />
          </g>
          <g fill="#000" transform="translate(193.2,143.2) rotate(33.69)">
            <path d="M-75-25h150v16.7h-150z" />
            <path d="M-75-8.3h150v16.7h-150z" />
            <path d="M-75 8.3h150v16.7h-150z" />
          </g>
          <g fill="#000" transform="translate(706.8,456.8) rotate(33.69)">
            <path d="M-75-25h50v16.7h-50zM25-25h50v16.7h-50z" />
            <path d="M-75-8.3h50v16.7h-50zM25-8.3h50v16.7h-50z" />
            <path d="M-75 8.3h50v16.7h-50zM25 8.3h50v16.7h-50z" />
          </g>
          <g fill="#000" transform="translate(706.8,143.2) rotate(-33.69)">
            <path d="M-75-25h50v16.7h-50zM25-25h50v16.7h-50z" />
            <path d="M-75-8.3h150v16.7h-150z" />
            <path d="M-75 8.3h50v16.7h-50zM25 8.3h50v16.7h-50z" />
          </g>
          <g fill="#000" transform="translate(193.2,456.8) rotate(-33.69)">
            <path d="M-75-25h150v16.7h-150z" />
            <path d="M-75-8.3h50v16.7h-50zM25-8.3h50v16.7h-50z" />
            <path d="M-75 8.3h150v16.7h-150z" />
          </g>
        </svg>
      );
    case 'en':
      return (
        <svg viewBox="0 0 60 30" {...props}>
          <clipPath id="s">
            <path d="M0,0 v30 h60 v-30 z" />
          </clipPath>
          <clipPath id="t">
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
          </clipPath>
          <g clipPath="url(#s)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      );
    case 'ja':
      return (
        <svg viewBox="0 0 900 600" {...props}>
          <rect width="900" height="600" fill="#fff" />
          <circle cx="450" cy="300" r="180" fill="#bc002d" />
        </svg>
      );
    case 'es':
      return (
        <svg viewBox="0 0 750 500" {...props}>
          <rect width="750" height="500" fill="#c60b1e" />
          <rect width="750" height="250" y="125" fill="#ffc400" />
        </svg>
      );
    default:
      return null;
  }
}
