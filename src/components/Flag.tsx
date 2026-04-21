type Props = {
  code: string;
  size?: number;
};

export function Flag({ code, size = 44 }: Props) {
  return (
    <span
      className={`flag-circle fi fi-${code}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
