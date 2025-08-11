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

  const itemFiles = [
    'elder_flower.json',
    'hollow_thorn.json',
    'mushroom.json',
    'sage.json',
    // New herbs
    'chamomile.json',
    'marshmallow.json',
    'meadowsweet.json',
    'elder_berry.json',
    'mint.json',
    'cloud_berries.json',
    'crow_berries.json',
    'wild_grass.json',
    'aloe_vera.json',
    'arnica.json',
    'blue_whortleberry.json',
    'yarrow.json',
    'angelica.json',
    'juniper_berry.json',
    'birch_bark.json',
    'pine_needles.json',
    'heather.json',
    'tincture.json',
    'energy_eminence.json',
      'vitality_eminence.json',
      'sword_eminence.json',
      'bow_eminence.json'
  ];

  function loadLocalSaves() {
    try {
      const raw = localStorage.getItem('saveData');
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error('Failed to parse save data from localStorage', err);
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

  window.electron = {
    async prefetch() {
      const items = [];
      for (const file of itemFiles) {
        const data = await fetchJson(`assets/items/${file}`);
        if (data) items.push(data);
      }
      return { items };
    },
    async findSaveData() {
      return loadLocalSaves();
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
