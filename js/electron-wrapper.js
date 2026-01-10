(function() {
  if (window.electron) {
    return;
  }

  console.log('Electron API not detected, using mock implementation');

  async function fetchJson(path) {
    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error('Failed to load', path, err);
      return null;
    }
  }

  async function loadItemIndex() {
    try {
      const indexResp = await fetch('assets/items/index.json');
      if (indexResp.ok) {
        const list = await indexResp.json();
        return Array.isArray(list) ? list : [];
      }
      const resp = await fetch('assets/items/');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return Array.from(doc.querySelectorAll('a'))
        .map((a) => a.getAttribute('href'))
        .filter((href) => href && href.endsWith('.json'))
        .map((href) => href.split('/').pop());
    } catch (err) {
      console.error('Failed to auto-discover item JSON files', err);
      return [];
    }
  }

  function loadLocalSaves() {
    try {
      const raw = localStorage.getItem('saveData');
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error('Failed to parse save data from localStorage', err);
      return {};
    }
  }

  function loadLocalHeapSaves() {
    try {
      const raw = localStorage.getItem('saveDataHeap');
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error('Failed to parse heap save data from localStorage', err);
      return {};
    }
  }

  function writeLocalSaves(data) {
    try {
      localStorage.setItem('saveData', JSON.stringify(data));
      return { success: true };
    } catch (err) {
      console.error('Failed to write save data to localStorage', err);
      return { success: false, error: err.message };
    }
  }

  function writeLocalHeapSaves(data) {
    try {
      localStorage.setItem('saveDataHeap', JSON.stringify(data));
      return { success: true };
    } catch (err) {
      console.error('Failed to write heap save data to localStorage', err);
      return { success: false, error: err.message };
    }
  }

  window.electron = {
    async prefetch() {
      const items = [];
      const itemFiles = await loadItemIndex();
      for (const file of itemFiles) {
        const data = await fetchJson(`assets/items/${file}`);
        if (data) items.push(data);
      }
      return { items };
    },
    async findSaveData() {
      return loadLocalSaves();
    },
    async findHeapData(username) {
      const data = loadLocalHeapSaves();
      if (!username) return data;
      const entry = data[username];
      if (entry && entry.heap) return entry.heap;
      return entry || null;
    },
    async createNewSave(playerInfo) {
      const data = loadLocalSaves();
      data[playerInfo.name] = playerInfo;
      return writeLocalSaves(data);
    },
    async persistSaveData(playerInfo) {
      const data = loadLocalSaves();
      data[playerInfo.name] = playerInfo;
      return writeLocalSaves(data);
    },
    async persistHeapData(playerInfo) {
      const data = loadLocalHeapSaves();
      data[playerInfo.name] = playerInfo;
      return writeLocalHeapSaves(data);
    },
      async deleteSave(username) {
          const data = loadLocalSaves();
          if (data && Object.prototype.hasOwnProperty.call(data, username)) {
              delete data[username];
              return writeLocalSaves(data);
          }
          return {success: false, error: `No such account: ${username}`};
      },
      async deleteAllSaves() {
          try {
              localStorage.removeItem('saveData');
              return {success: true};
          } catch (err) {
              return {success: false, error: err.message};
          }
    }
  };
})();
