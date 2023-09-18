const { ElementFromFile, templatePath } = require("../utils");

function $(selector) {
  return document.querySelector(selector);
}

const button = ElementFromFile(templatePath(__dirname, "scrollbutton.html"));

module.exports = () => {
  document.addEventListener(
    "apiLoaded",
    () => {
      observePlaylist();
    },
    {
      once: true,
      passive: true,
    }
  );
};

function observePlaylist() {
  const observer = new MutationObserver(() => {
    const playlistMenu = $(".detail-page-menu");

    if (playlistMenu && !playlistMenu.contains(button)) {
      playlistMenu.prepend(button);
      console.log(button);
      button.addEventListener("click", () => {
        const scrollToLast = () =>
          document
            .querySelector("#contents.ytmusic-playlist-shelf-renderer")
            .lastElementChild.scrollIntoView();

        scrollToLast();
        const listObserver = new MutationObserver((muts) => {
          const addedContent = muts.filter(
            (mut) => mut.type === "childList" && mut.target.id === "content"
          );

          if (addedContent.length >= 1) {
            scrollToLast();
          }

          if (
            !document.querySelector(
              "#continuations.style-scope.ytmusic-playlist-shelf-renderer yt-next-continuation"
            )
          ) {
            scrollToLast();
            listObserver.disconnect();
          }
        });
        listObserver.observe($("ytmusic-playlist-shelf-renderer"), {
          childList: true,
          subtree: true,
        });
      });
    }
  });

  observer.observe($("#browse-page"), {
    childList: true,
    subtree: true,
  });
}
