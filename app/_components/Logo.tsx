// 共通ヘッダーロゴ。テキスト "INSTYLE GROUP" の代替として使う。
// 主張させすぎないよう、デザインシステムのガイドに従い 14px ベース・最大 18px。

// next.config.ts の basePath が /recruitment-test-2026 のため、
// public/logo.svg は /recruitment-test-2026/logo.svg として配信される。
const LOGO_SRC = "/recruitment-test-2026/logo.svg";

export function Logo({
  height = 14,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="INSTYLE GROUP"
      width={undefined}
      height={height}
      className={className}
      style={{ height: `${height}px`, width: "auto", display: "block" }}
    />
  );
}
