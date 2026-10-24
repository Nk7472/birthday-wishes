import { animClass } from './Reveal';

/**
 * Animates text letter by letter. Words never break across lines.
 *   <SplitText text="Happy Birthday" delay={400} stagger={55} anim="pop-in"
 *              className="font-pacifico text-5xl text-white" />
 * letterStyle(i, char) can return extra inline style per letter (colours, etc).
 */
export default function SplitText({
  text,
  delay = 0,
  stagger = 45,
  anim = 'fade-up',
  className = '',
  letterClassName = '',
  letterStyle,
  as: Tag = 'span',
}) {
  const words = String(text).split(' ');
  // index of the first letter of every word (a space counts as one step)
  const starts = [];
  words.reduce((acc, w) => {
    starts.push(acc);
    return acc + [...w].length + 1;
  }, 0);

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} aria-hidden="true">
          <span className="inline-block whitespace-nowrap">
            {[...word].map((ch, ci) => {
              const i = starts[wi] + ci;
              return (
                <span
                  key={ci}
                  className={`inline-block ${animClass(anim)} ${letterClassName}`}
                  style={{ animationDelay: `${delay + i * stagger}ms`, ...(letterStyle ? letterStyle(i, ch) : null) }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}
