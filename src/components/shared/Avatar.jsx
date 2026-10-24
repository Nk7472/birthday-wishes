import { useWish } from './WishContext';

/**
 * The friend's photo, or a colourful initial when no photo was uploaded.
 * Size it with className (e.g. "h-32 w-32"). Shape defaults to a circle —
 * pass rounded="rounded-none" / "rounded-2xl" etc. to change it.
 */
export default function Avatar({
  className = 'h-32 w-32',
  rounded = 'rounded-full',
  fallbackClassName = 'bg-[#8e8e93]',
  textClassName = 'text-white font-ui font-extrabold',
  style,
  imgStyle,
  alt,
}) {
  const w = useWish();
  // the sender can choose a square frame; scenes that ask for a circle get a soft square instead
  const shape = w.frame === 'square' && rounded.includes('rounded-full') ? 'rounded-[22%]' : rounded;
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${shape} ${className}`}
      style={{ containerType: 'size', ...style }}
    >
      {w.hasPhoto ? (
        <img
          src={w.photo}
          alt={alt ?? w.name}
          draggable={false}
          className="h-full w-full object-cover"
          style={imgStyle}
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center ${fallbackClassName}`}>
          <span className={textClassName} style={{ fontSize: '52cqh', lineHeight: 1 }} aria-hidden="true">
            {w.initials}
          </span>
        </div>
      )}
    </div>
  );
}
