import searchBarHtml from './searchbar.html?raw';
import dropDownItemHtml from './dropdown-item.html?raw';

interface songElement {
  name: string;
  id: string;
  playListId: string;
  imgUrl: {
    url?: string;
    width?: number;
    height?: number;
  } | null;
  duration: string;
}

const clearResults = () => {
  const sbardiv = document.querySelector('#sbardiv') as HTMLDivElement;
  const ul = sbardiv.querySelector('ul');
  if (ul) ul.remove();
};
const showResults = (list: songElement[]) => {
  if (list.length < 1) return;
  const sbardiv = document.querySelector('#sbardiv') as HTMLDivElement;
  const ul = document.createElement('ul');
  sbardiv.appendChild(ul);
  list.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = dropDownItemHtml;
    const itemImg = li.querySelector('.item-img') as HTMLImageElement;
    itemImg.src = item.imgUrl?.url || '';
    itemImg.width = 70;
    const songName = li.querySelector('.song-name') as HTMLSpanElement;
    songName.innerHTML = item.name.split('-')[0];
    const artist = li.querySelector('.artist') as HTMLSpanElement;
    artist.innerHTML = item.name.split('-')[1] || '';
    const dropdownItem = li.querySelector('.dropdown-item') as HTMLDivElement;
    dropdownItem.addEventListener('click', () => {
      window.location.href = `https://music.youtube.com/watch?v=${item.id}&list=${item.playListId}`;
    });
    ul.appendChild(li);
  });
};
const isAdded = (element: HTMLElement, id: string): boolean =>
  element.querySelector(id) != null;

export const addSearch = (pageType: string | null, list: songElement[]) => {
  const id = '#searchbar';
  const sidePanelId = '#side-panel';
  const secondaryContentId = '#secondary #contents';
  const sidePanel = document.querySelector(sidePanelId) as HTMLElement;
  const secondaryContent = document.querySelector(
    secondaryContentId,
  ) as HTMLElement;

  switch (pageType) {
    case 'watch':
      if (!isAdded(sidePanel, id)) addSearchTo(sidePanel, list);
      break;
    case 'playlist':
      if (!isAdded(secondaryContent, id)) addSearchTo(secondaryContent, list);
      break;
  }
};
const addSearchTo = (container: HTMLElement, list: songElement[]) => {
  const div = document.createElement('div');
  div.id = 'searchbar';
  div.innerHTML = searchBarHtml;
  container?.insertBefore(div, container.children[0]);

  const sbarInput = document.querySelector('#sbarInput') as HTMLInputElement;
  let time: ReturnType<typeof setTimeout>;
  let isActive = true;
  const inputListener = () => {
    if (!isActive) return;
    clearResults();
    clearTimeout(time);
    time = setTimeout(() => {
      const filterList = list.filter((item) => {
        if (sbarInput.value == '') return false;
        if (item.name.toUpperCase().includes(sbarInput.value.toUpperCase()))
          return true;
        return false;
      });
      if (filterList) showResults(filterList);
    }, 500);
  };
  sbarInput.addEventListener('input', inputListener);
  sbarInput.addEventListener('blur', () => (isActive = false));
  sbarInput.addEventListener('focus', () => (isActive = true));
};
