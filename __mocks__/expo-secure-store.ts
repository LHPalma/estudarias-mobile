// O cofre do sistema não existe no Jest: os testes usam este, em memória, e o esvaziam entre um teste e outro.
const items = new Map<string, string>();

export const getItemAsync = async (key: string) => items.get(key) ?? null;
export const setItemAsync = async (key: string, value: string) => {
  items.set(key, value);
};
export const deleteItemAsync = async (key: string) => {
  items.delete(key);
};
export const __reset = () => items.clear();
