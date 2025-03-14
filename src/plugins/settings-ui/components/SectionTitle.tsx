interface SectionTitleProps {
  title: string;
}

export const SectionTitle = ({ title }: SectionTitleProps) => {
  return (
    <>
      <yt-formatted-string
        class="title text style-scope ytmusic-carousel-shelf-basic-header-renderer"
        style={{ 'user-select': 'none' }}
        text={{ runs: [{ text: title }] }}
      />
    </>
  );
};
