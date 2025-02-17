import { createStore } from 'solid-js/store';

type ClinetUser = {
  name: string;
  thumbnail: string;
};

const id = Date.now().toString(36);
const name = `Guest ${id.slice(0, 4)}`;
const thumbnail = `https://ui-avatars.com/api/?name=${name}&background=random`;
export const [user, setUser] = createStore<ClinetUser>({
  name,
  thumbnail,
});
