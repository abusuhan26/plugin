(() => {
  'use strict';

  const MC_VERSION = '1.21.8';
  const DATA_BASE = `https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/${MC_VERSION}`;
  const ASSET_BASE = `https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/${MC_VERSION}`;

  const fallbackBlocks = [
    ['hay_block', 'Hay Block'], ['stone', 'Stone'], ['cobblestone', 'Cobblestone'], ['grass_block', 'Grass Block'],
    ['dirt', 'Dirt'], ['oak_log', 'Oak Log'], ['oak_planks', 'Oak Planks'], ['iron_block', 'Block of Iron'],
    ['gold_block', 'Block of Gold'], ['diamond_block', 'Block of Diamond'], ['emerald_block', 'Block of Emerald'],
    ['netherite_block', 'Block of Netherite'], ['coal_block', 'Block of Coal'], ['redstone_block', 'Block of Redstone'],
    ['amethyst_block', 'Block of Amethyst'], ['copper_block', 'Block of Copper'], ['ancient_debris', 'Ancient Debris'],
    ['obsidian', 'Obsidian'], ['bedrock', 'Bedrock'], ['spawner', 'Monster Spawner'], ['beacon', 'Beacon'],
    ['furnace', 'Furnace'], ['barrel', 'Barrel'], ['chest', 'Chest'], ['crafting_table', 'Crafting Table']
  ].map(([name, displayName], id) => ({ id, name, displayName }));

  const fallbackItems = [
    ['wheat', 'Wheat'], ['hay_block', 'Hay Block'], ['diamond', 'Diamond'], ['emerald', 'Emerald'], ['iron_ingot', 'Iron Ingot'],
    ['gold_ingot', 'Gold Ingot'], ['netherite_ingot', 'Netherite Ingot'], ['coal', 'Coal'], ['redstone', 'Redstone Dust'],
    ['lapis_lazuli', 'Lapis Lazuli'], ['amethyst_shard', 'Amethyst Shard'], ['copper_ingot', 'Copper Ingot'],
    ['apple', 'Apple'], ['carrot', 'Carrot'], ['potato', 'Potato'], ['beetroot', 'Beetroot'], ['diamond_sword', 'Diamond Sword'],
    ['nether_star', 'Nether Star'], ['experience_bottle', 'Bottle o’ Enchanting'], ['echo_shard', 'Echo Shard']
  ].map(([name, displayName], id) => ({ id, name, displayName }));

  const loreOptions = [
    ['tier', '%tier%', 'Tier'],
    ['buyPrice', '%buy-price%$', 'Buy price'],
    ['speed', '%speed%', 'Speed'],
    ['dropName', '%drop-name%', 'Primary drop'],
    ['dropMaterial', '%drop-material%', 'Drop material'],
    ['dropNameNumbered', '%drop-name-<n>%', 'Each drop name'],
    ['dropMaterialNumbered', '%drop-material-<n>%', 'Each material'],
    ['dropChanceNumbered', '%drop-chance-<n>%', 'Each chance'],
    ['sellPrice', '%sell-price%', 'Primary sell price'],
    ['sellPriceNumbered', '%sell-price-<n>%', 'Each sell price'],
    ['upgradePrice', '%upgrade-price%', 'Upgrade price'],
    ['repairCost', '%repair-cost%', 'Repair cost']
  ];

  const hologramPlaceholders = [
    ['%tier%', 'Tier'], ['%drop-name%', 'Drop name'], ['%drop-material%', 'Material'],
    ['%next-spawn%', 'Next spawn'], ['%spawn-time%', 'Spawn time'], ['%sell-price%', 'Sell price']
  ];

  const state = {
    tierCount: 5,
    nameMode: 'drop',
    speedMode: 'fixed',
    pickerType: 'blocks',
    pickerTarget: { type: 'generator', dropIndex: null },
    materialLimit: 126,
    blocks: fallbackBlocks,
    items: fallbackItems,
    generatorMaterial: normalizeMaterial(fallbackBlocks[0], 'block'),
    dropItems: [createDropState(normalizeMaterial(fallbackItems[0], 'item'), 50, 'prev * 2')],
    lore: Object.fromEntries(loreOptions.map(([key]) => [key, true]))
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const els = {
    tierCount: $('#tierCount'),
    heroTierCount: $('#heroTierCount'),
    dataStatus: $('#dataStatus'),
    generatorMaterialName: $('#generatorMaterialName'),
    generatorMaterialId: $('#generatorMaterialId'),
    generatorMaterialImage: $('#generatorMaterialImage'),
    generatorNamePreview: $('#generatorNamePreview'),
    lockedHologramName: $('#lockedHologramName'),
    customNameWrap: $('#customNameWrap'),
    materialModal: $('#materialModal'),
    previewModal: $('#previewModal'),
    materialSearch: $('#materialSearch'),
    materialGrid: $('#materialGrid'),
    pickerResultCount: $('#pickerResultCount'),
    pickerLoadingState: $('#pickerLoadingState'),
    loadMoreMaterials: $('#loadMoreMaterials'),
    dropItemsContainer: $('#dropItemsContainer'),
    yamlOutput: $('#yamlOutput'),
    tierCards: $('#tierCards'),
    toast: $('#toast'),
    hardnessRange: $('#hardnessRange'),
    hardnessOutput: $('#hardnessOutput')
  };

  function normalizeMaterial(raw, kind) {
    const name = String(raw.name || '').replace(/^minecraft:/, '');
    return {
      name,
      displayName: raw.displayName || titleCase(name),
      bukkitId: name.toUpperCase(),
      kind
    };
  }

  function createDropState(material, sellBase = 50, sellFormula = 'prev * 2') {
    return { material, sellBase, sellFormula };
  }

  function titleCase(value) {
    return value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return '0';
    const rounded = Math.round((value + Number.EPSILON) * 1000000) / 1000000;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, '').replace(/\.$/, '');
  }

  function yamlNumber(value, decimals = 1) {
    if (!Number.isFinite(value)) value = 0;
    return Number.isInteger(value) ? value.toFixed(decimals) : formatNumber(value);
  }

  function escapeYamlSingle(value) {
    return String(value).replace(/'/g, "''");
  }

  function generatorName() {
    const firstDrop = state.dropItems[0]?.material;
    if (state.nameMode === 'drop' && firstDrop) return `&#FFCC00&l${firstDrop.displayName.toUpperCase()} GENERATOR`;
    const custom = ($('#customGeneratorName').value || '&#FFCC00&lGENERATOR').trim();
    return /generator\s*$/i.test(custom) ? custom : `${custom} GENERATOR`;
  }

  function dropFormattedName(material) {
    return `&#FFCC00&l${material.displayName.toUpperCase()}`;
  }

  function expressionValue(expression, variables) {
    const source = String(expression || '').trim().replace(/\^/g, '**');
    if (!source) throw new Error('Formula is empty.');
    const permitted = /^[0-9a-zA-Z_+\-*/%().,\s*]+$/;
    if (!permitted.test(source)) throw new Error('Unsupported character in formula.');

    const identifiers = source.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
    const allowed = new Set(['t', 'prev', 'base', 'x', 'sqrt', 'root', 'square', 'cube', 'min', 'max', 'abs', 'round', 'floor', 'ceil', 'pow']);
    const unknown = identifiers.find(id => !allowed.has(id));
    if (unknown) throw new Error(`Unknown variable/function: ${unknown}`);

    const helpers = {
      sqrt: Math.sqrt,
      root: (value, degree = 2) => Math.pow(value, 1 / degree),
      square: value => value * value,
      cube: value => value * value * value,
      min: Math.min,
      max: Math.max,
      abs: Math.abs,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
      pow: Math.pow
    };

    const keys = [...Object.keys(variables), ...Object.keys(helpers)];
    const values = [...Object.values(variables), ...Object.values(helpers)];
    const result = Function(...keys, `"use strict"; return (${source});`)(...values);
    if (!Number.isFinite(result)) throw new Error('Formula did not return a finite number.');
    return result;
  }

  function buildSeries(base, formula, count, extra = {}) {
    const values = [number(base)];
    for (let tier = 2; tier <= count; tier += 1) {
      try {
        values.push(expressionValue(formula, { t: tier, prev: values[tier - 2], base: values[0], x: extra.x ?? 1 }));
      } catch {
        values.push(values[tier - 2]);
      }
    }
    return values;
  }

  function calculateTiers() {
    const count = state.tierCount;
    const levelBase = number($('#levelBase').value, 0);
    const hardness = number(els.hardnessRange.value, 1);
    const priceBase = number($('#priceBase').value, 0);
    const prices = buildSeries(priceBase, $('#priceFormula').value, count);
    const speedBase = number($('#speedBase').value, 600);
    let speeds = [];

    if (state.speedMode === 'fixed') {
      speeds = Array.from({ length: count }, () => speedBase);
    } else if (state.speedMode === 'step') {
      const step = number($('#speedStep').value, .1);
      const direction = $('#speedDirection').value === 'increase' ? 1 : -1;
      speeds = Array.from({ length: count }, (_, i) => Math.max(1, speedBase * Math.max(.01, 1 + direction * step * i)));
    } else {
      speeds = buildSeries(speedBase, $('#speedFormula').value, count);
    }

    const dropSeries = state.dropItems.map((drop, index) => {
      const card = els.dropItemsContainer.children[index];
      const base = number($('.drop-sell-base', card)?.value, drop.sellBase);
      const formula = $('.drop-sell-formula', card)?.value || drop.sellFormula;
      drop.sellBase = base;
      drop.sellFormula = formula;
      return buildSeries(base, formula, count);
    });

    return Array.from({ length: count }, (_, index) => ({
      tier: index + 1,
      level: levelBase * Math.pow(hardness, index),
      price: prices[index],
      speed: speeds[index],
      drops: state.dropItems.map((drop, dropIndex) => ({ ...drop, sellPrice: dropSeries[dropIndex][index] }))
    }));
  }

  function generatorLore(tier) {
    if (!$('#generatorLoreEnabled').checked) return [];
    const lines = [''];
    const l = state.lore;
    const hasStats = l.tier || l.buyPrice || l.speed || l.upgradePrice || l.repairCost;
    const hasDrops = l.dropName || l.dropMaterial || l.dropNameNumbered || l.dropMaterialNumbered || l.dropChanceNumbered || l.sellPrice || l.sellPriceNumbered;

    if (hasStats) {
      lines.push('&#FFCC00sᴛᴀᴛs');
      if (l.tier) lines.push(' &8❙ &fTier: &#FFCC00%tier%');
      if (l.buyPrice) lines.push(' &8❙ &fPrice: &#FFCC00%buy-price%$');
      if (l.speed) lines.push(' &8❙ &fSpeed: &#FFCC00%speed% seconds');
      if (l.upgradePrice) lines.push(' &8❙ &fUpgrade: &#FFCC00%upgrade-price%$');
      if (l.repairCost) lines.push(' &8❙ &fRepair: &#FFCC00%repair-cost%$');
      lines.push('');
    }

    if (hasDrops) {
      lines.push('&#FFCC00ᴅʀᴏᴘs');
      if (l.dropName) lines.push(' &8❙ &fPrimary: &#FFCC00%drop-name%');
      if (l.dropMaterial) lines.push(' &8❙ &fMaterial: &#FFCC00%drop-material%');
      if (l.sellPrice) lines.push(' &8❙ &fSell-price: &#FFCC00%sell-price%$');
      tier.drops.forEach((_, index) => {
        const n = index + 1;
        if (l.dropNameNumbered || l.dropMaterialNumbered || l.dropChanceNumbered || l.sellPriceNumbered) lines.push(` &#DDDDDD--- ${n}. ---`);
        if (l.dropNameNumbered) lines.push(` &8❙ &fItem: &#FFCC00%drop-name-${n}%`);
        if (l.dropMaterialNumbered) lines.push(` &8❙ &fMaterial: &#FFCC00%drop-material-${n}%`);
        if (l.sellPriceNumbered) lines.push(` &8❙ &fSell-price: &#FFCC00%sell-price-${n}%$`);
        if (l.dropChanceNumbered) lines.push(` &8❙ &fChance: &#FFCC00%drop-chance-${n}%%`);
      });
      lines.push('');
    }
    lines.push('&#FFCC00&l(!) &#FFCC00Place it down to start generating!');
    return lines;
  }

  function buildYaml() {
    const tiers = calculateTiers();
    const removeFromShop = $('#removeFromShop').checked;
    const allowBuying = $('#allowBuying').checked;
    const hologramEnabled = $('#hologramEnabled').checked;
    const hologramHeight = number($('#hologramHeight').value, 2.25);
    const hologramLines = $('#hologramLines').value.split(/\r?\n/);
    const name = generatorName();

    const out = [
      '# Generated by AxGens Tier Studio',
      `# Minecraft data/assets version: ${MC_VERSION}`,
      '# Formula variables used in the editor: t = tier, prev = previous tier, base = tier 1, x = custom multiplier',
      'tiers:'
    ];

    tiers.forEach(tier => {
      out.push(`  '${tier.tier}':`);
      out.push('    generator-item:');
      out.push(`      remove-from-shop: ${removeFromShop}`);
      out.push(`      allow-buying: ${allowBuying}`);
      out.push(`      material: ${state.generatorMaterial.bukkitId}`);
      out.push(`      name: '${escapeYamlSingle(name)}'`);
      out.push(`      level-requirement: ${formatNumber(tier.level)}`);
      out.push(`      price: ${yamlNumber(tier.price)}`);
      out.push(`      speed: ${formatNumber(tier.speed)}`);
      const lore = generatorLore(tier);
      if (lore.length) {
        out.push('      lore:');
        lore.forEach(line => out.push(`      - '${escapeYamlSingle(line)}'`));
      }

      out.push('    drop-item:');
      tier.drops.forEach(drop => {
        out.push('      - chance: 100.0');
        out.push(`        sell-price: ${yamlNumber(drop.sellPrice)}`);
        out.push(`        material: ${drop.material.bukkitId}`);
        out.push(`        name: '${escapeYamlSingle(dropFormattedName(drop.material))}'`);
        out.push('        lore:');
        out.push("        - ''");
        out.push("        - ' &7- &fSell price: &#33FF33%sell-price%$'");
        out.push("        - ''");
      });

      out.push('    hologram:');
      out.push(`      enabled: ${hologramEnabled}`);
      if (hologramEnabled) {
        out.push(`      height: ${formatNumber(hologramHeight)}`);
        out.push('      lines:');
        out.push(`      - '${escapeYamlSingle(name)}'`);
        hologramLines.forEach(line => out.push(`      - '${escapeYamlSingle(line)}'`));
      }
    });

    return out.join('\n') + '\n';
  }

  function textureCandidates(material) {
    const n = material.name;
    const item = `${ASSET_BASE}/items/${n}.png`;
    if (material.kind === 'item') return [item];

    const special = {
      grass_block: 'grass_block_side', podzol: 'podzol_side', mycelium: 'mycelium_side',
      hay_block: 'hay_block_side', ancient_debris: 'ancient_debris_side', crafting_table: 'crafting_table_front',
      furnace: 'furnace_front', blast_furnace: 'blast_furnace_front', smoker: 'smoker_front',
      chest: 'oak_planks', trapped_chest: 'oak_planks', ender_chest: 'obsidian',
      spawner: 'spawner', enchanting_table: 'enchanting_table_side', respawn_anchor: 'respawn_anchor_side0'
    };
    const blockNames = [special[n], n, `${n}_side`, `${n}_top`, n.replace(/_(slab|stairs|wall|fence|fence_gate|button|pressure_plate)$/, '')].filter(Boolean);
    return [item, ...new Set(blockNames)].map((name, i) => i === 0 ? name : `${ASSET_BASE}/blocks/${name}.png`);
  }

  function assignTexture(img, material) {
    const candidates = textureCandidates(material);
    img.dataset.candidates = JSON.stringify(candidates);
    img.dataset.candidateIndex = '0';
    img.alt = material.displayName;
    img.src = candidates[0];
  }

  document.addEventListener('error', event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.candidates) return;
    const candidates = JSON.parse(img.dataset.candidates);
    const next = Number(img.dataset.candidateIndex || 0) + 1;
    if (next < candidates.length) {
      img.dataset.candidateIndex = String(next);
      img.src = candidates[next];
    } else {
      img.removeAttribute('src');
      img.alt = 'Texture unavailable';
      img.parentElement?.classList.add('texture-missing');
    }
  }, true);

  function renderLoreOptions() {
    const root = $('#generatorLorePlaceholders');
    root.innerHTML = '';
    loreOptions.forEach(([key, placeholder, label]) => {
      const chip = document.createElement('label');
      chip.className = 'placeholder-chip';
      chip.innerHTML = `<input type="checkbox" data-lore-key="${key}" ${state.lore[key] ? 'checked' : ''}><strong>${placeholder}</strong><small>${label}</small>`;
      root.appendChild(chip);
    });

    $('#hologramPlaceholderButtons').innerHTML = hologramPlaceholders.map(([placeholder, label]) =>
      `<button class="placeholder-chip hologram-insert" type="button" data-placeholder="${placeholder}"><strong>${placeholder}</strong><small>${label}</small></button>`
    ).join('');
  }

  function renderDropItems() {
    const template = $('#dropItemTemplate');
    els.dropItemsContainer.innerHTML = '';
    state.dropItems.forEach((drop, index) => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.dropIndex = String(index);
      $('.drop-number', node).textContent = `#${index + 1}`;
      $('.drop-material-name', node).textContent = drop.material.displayName;
      $('.drop-material-id', node).textContent = drop.material.bukkitId;
      $('.drop-name-preview', node).textContent = dropFormattedName(drop.material);
      $('.drop-sell-base', node).value = formatNumber(drop.sellBase);
      $('.drop-sell-formula', node).value = drop.sellFormula;
      assignTexture($('.drop-material-image', node), drop.material);
      if (state.dropItems.length === 1) $('.remove-drop', node).disabled = true;
      els.dropItemsContainer.appendChild(node);
    });
  }

  function updateGeneratorMaterial() {
    els.generatorMaterialName.textContent = state.generatorMaterial.displayName;
    els.generatorMaterialId.textContent = state.generatorMaterial.bukkitId;
    assignTexture(els.generatorMaterialImage, state.generatorMaterial);
  }

  function updateNameUI() {
    const name = generatorName();
    els.generatorNamePreview.textContent = name;
    els.lockedHologramName.textContent = name;
  }

  function updateHardnessRange() {
    const min = number(els.hardnessRange.min);
    const max = number(els.hardnessRange.max);
    const value = number(els.hardnessRange.value);
    const percent = ((value - min) / (max - min)) * 100;
    els.hardnessRange.style.setProperty('--value', `${percent}%`);
    els.hardnessOutput.textContent = `${value.toFixed(2)}×`;
  }

  function validateFormula(input, messageElement = null) {
    try {
      expressionValue(input.value, { t: 2, prev: 100, base: 50, x: 2 });
      input.setCustomValidity('');
      if (messageElement) messageElement.textContent = '';
      return true;
    } catch (error) {
      input.setCustomValidity(error.message);
      if (messageElement) messageElement.textContent = error.message;
      return false;
    }
  }

  function renderTierCards() {
    const tiers = calculateTiers();
    const visible = tiers.slice(0, 5);
    els.tierCards.innerHTML = visible.map((tier, index) => `
      <article class="tier-card" style="--accent:${['#8b5cf6','#38bdf8','#2dd4bf','#ec4899','#f59e0b'][index % 5]}; animation-delay:${index * .05}s">
        <span>Calculated tier</span>
        <h3>Tier ${tier.tier}</h3>
        <div class="tier-stat"><span>Level</span><strong>${formatNumber(tier.level)}</strong></div>
        <div class="tier-stat"><span>Price</span><strong>${formatNumber(tier.price)}</strong></div>
        <div class="tier-stat"><span>Speed</span><strong>${formatNumber(tier.speed)}</strong></div>
        <div class="tier-stat"><span>Drop value</span><strong>${formatNumber(tier.drops[0]?.sellPrice || 0)}</strong></div>
      </article>
    `).join('') + (tiers.length > 5 ? `
      <article class="tier-card more-card"><div><strong>+${tiers.length - 5}</strong><p>additional tiers included in YAML</p></div></article>
    ` : '');
  }

  function refresh() {
    state.tierCount = Math.max(1, Math.min(100, Math.round(number(els.tierCount.value, 1))));
    els.tierCount.value = state.tierCount;
    els.heroTierCount.textContent = state.tierCount;
    updateNameUI();
    renderTierCards();
    els.yamlOutput.textContent = buildYaml();
  }

  async function loadMinecraftData() {
    els.dataStatus.textContent = 'Loading…';
    try {
      const [blocksResponse, itemsResponse] = await Promise.all([
        fetch(`${DATA_BASE}/blocks.json`, { cache: 'force-cache' }),
        fetch(`${DATA_BASE}/items.json`, { cache: 'force-cache' })
      ]);
      if (!blocksResponse.ok || !itemsResponse.ok) throw new Error('Remote dataset unavailable');
      const [blocks, items] = await Promise.all([blocksResponse.json(), itemsResponse.json()]);
      state.blocks = blocks.map(block => normalizeMaterial(block, 'block'));
      state.items = items.map(item => normalizeMaterial(item, 'item'));
      els.dataStatus.textContent = `${state.blocks.length + state.items.length} materials`;
      els.pickerLoadingState.textContent = 'PrismarineJS data connected';
    } catch (error) {
      state.blocks = fallbackBlocks.map(block => normalizeMaterial(block, 'block'));
      state.items = fallbackItems.map(item => normalizeMaterial(item, 'item'));
      els.dataStatus.textContent = 'Offline fallback';
      els.pickerLoadingState.textContent = 'Using bundled fallback list';
      console.warn(error);
    }
  }

  function openMaterialPicker(targetType, dropIndex = null) {
    state.pickerTarget = { type: targetType, dropIndex };
    state.pickerType = targetType === 'generator' ? 'blocks' : 'items';
    state.materialLimit = 126;
    els.materialSearch.value = '';
    $$('[data-segment-group="pickerType"] button').forEach(button => button.classList.toggle('active', button.dataset.value === state.pickerType));
    $('#materialModalTitle').textContent = targetType === 'generator' ? 'Choose generator block' : 'Choose drop item';
    renderMaterials();
    openModal(els.materialModal);
    setTimeout(() => els.materialSearch.focus(), 180);
  }

  function filteredMaterials() {
    const query = els.materialSearch.value.trim().toLowerCase();
    const list = state.pickerType === 'blocks' ? state.blocks : state.items;
    if (!query) return list;
    return list.filter(material => material.name.includes(query) || material.displayName.toLowerCase().includes(query) || material.bukkitId.toLowerCase().includes(query));
  }

  function renderMaterials() {
    const all = filteredMaterials();
    const shown = all.slice(0, state.materialLimit);
    const selected = state.pickerTarget.type === 'generator' ? state.generatorMaterial : state.dropItems[state.pickerTarget.dropIndex]?.material;
    els.pickerResultCount.textContent = `${all.length.toLocaleString()} materials`;
    els.loadMoreMaterials.hidden = shown.length >= all.length;
    els.materialGrid.innerHTML = '';

    const fragment = document.createDocumentFragment();
    shown.forEach(material => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = `material-option${selected?.bukkitId === material.bukkitId ? ' selected' : ''}`;
      option.dataset.materialName = material.name;
      option.innerHTML = `<span class="material-thumb checker"><img alt=""></span><strong>${material.displayName}</strong><code>${material.bukkitId}</code>`;
      assignTexture($('img', option), material);
      fragment.appendChild(option);
    });
    els.materialGrid.appendChild(fragment);
  }

  function selectMaterial(name) {
    const list = state.pickerType === 'blocks' ? state.blocks : state.items;
    const material = list.find(entry => entry.name === name);
    if (!material) return;
    if (state.pickerTarget.type === 'generator') {
      state.generatorMaterial = material;
      updateGeneratorMaterial();
    } else {
      state.dropItems[state.pickerTarget.dropIndex].material = material;
      renderDropItems();
    }
    closeModal(els.materialModal);
    refresh();
    showToast(`${material.bukkitId} selected`);
  }

  function openModal(modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
  }

  let toastTimer;
  function showToast(message) {
    clearTimeout(toastTimer);
    $('p', els.toast).textContent = message;
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }

  function downloadYaml() {
    const yaml = buildYaml();
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tiers.yml';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast('tiers.yml downloaded');
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    showToast(successMessage);
  }

  function setSection(name) {
    $$('.section-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.section === name));
    $$('[data-section-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.sectionPanel === name));
    window.scrollTo({ top: Math.max(0, $('.workspace').offsetTop - 98), behavior: 'smooth' });
  }

  function setSegment(group, value) {
    $$(`[data-segment-group="${group}"] button`).forEach(button => button.classList.toggle('active', button.dataset.value === value));
    if (group === 'nameMode') {
      state.nameMode = value;
      els.customNameWrap.hidden = value !== 'custom';
    }
    if (group === 'speedMode') {
      state.speedMode = value;
      $('#speedFixedOptions').hidden = value !== 'fixed';
      $('#speedStepOptions').hidden = value !== 'step';
      $('#speedCustomOptions').hidden = value !== 'custom';
    }
    if (group === 'pickerType') {
      state.pickerType = value;
      state.materialLimit = 126;
      renderMaterials();
    }
    refresh();
  }

  function bindEvents() {
    $('#tierMinus').addEventListener('click', () => { els.tierCount.value = Math.max(1, state.tierCount - 1); refresh(); });
    $('#tierPlus').addEventListener('click', () => { els.tierCount.value = Math.min(100, state.tierCount + 1); refresh(); });
    els.tierCount.addEventListener('input', refresh);

    $$('.section-tab').forEach(tab => tab.addEventListener('click', () => setSection(tab.dataset.section)));
    $$('[data-segment-group]').forEach(group => {
      const groupName = group.dataset.segmentGroup;
      $$('button', group).forEach(button => button.addEventListener('click', () => setSegment(groupName, button.dataset.value)));
    });

    $('#generatorMaterialButton').addEventListener('click', () => openMaterialPicker('generator'));
    els.dropItemsContainer.addEventListener('click', event => {
      const card = event.target.closest('.drop-card');
      if (!card) return;
      const index = Number(card.dataset.dropIndex);
      if (event.target.closest('.drop-material-button')) openMaterialPicker('drop', index);
      if (event.target.closest('.remove-drop') && state.dropItems.length > 1) {
        state.dropItems.splice(index, 1);
        renderDropItems();
        refresh();
      }
    });
    els.dropItemsContainer.addEventListener('input', event => {
      const card = event.target.closest('.drop-card');
      if (!card) return;
      const index = Number(card.dataset.dropIndex);
      if (event.target.matches('.drop-sell-base')) state.dropItems[index].sellBase = number(event.target.value);
      if (event.target.matches('.drop-sell-formula')) {
        state.dropItems[index].sellFormula = event.target.value;
        validateFormula(event.target);
      }
      refresh();
    });

    $('#addDropButton').addEventListener('click', () => {
      const defaultMaterial = state.items.find(item => item.name === 'diamond') || state.items[0] || normalizeMaterial(fallbackItems[0], 'item');
      state.dropItems.push(createDropState(defaultMaterial, 100, 'prev * 2'));
      renderDropItems();
      refresh();
      showToast('Drop item added');
    });

    $('#generatorLorePlaceholders').addEventListener('change', event => {
      if (!event.target.dataset.loreKey) return;
      state.lore[event.target.dataset.loreKey] = event.target.checked;
      refresh();
    });

    $('#hologramPlaceholderButtons').addEventListener('click', event => {
      const button = event.target.closest('.hologram-insert');
      if (!button) return;
      const textarea = $('#hologramLines');
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.slice(0, start) + button.dataset.placeholder + textarea.value.slice(end);
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + button.dataset.placeholder.length;
      refresh();
    });

    $('#hologramEnabled').addEventListener('change', event => { $('#hologramOptions').hidden = !event.target.checked; refresh(); });
    $('#copyHologramButton').addEventListener('click', () => showToast(`Hologram format copied to ${state.tierCount} tiers`));

    els.hardnessRange.addEventListener('input', () => { updateHardnessRange(); refresh(); });
    $('#priceFormula').addEventListener('input', event => { validateFormula(event.target, $('#priceFormulaValidation')); refresh(); });
    $('#speedFormula').addEventListener('input', event => { validateFormula(event.target); refresh(); });

    const reactiveSelector = 'input:not(#tierCount):not(#hardnessRange), textarea, select';
    $$(reactiveSelector).forEach(input => input.addEventListener('input', refresh));
    $('#customGeneratorName').addEventListener('input', updateNameUI);

    els.materialSearch.addEventListener('input', () => { state.materialLimit = 126; renderMaterials(); });
    els.loadMoreMaterials.addEventListener('click', () => { state.materialLimit += 126; renderMaterials(); });
    els.materialGrid.addEventListener('click', event => {
      const option = event.target.closest('.material-option');
      if (option) selectMaterial(option.dataset.materialName);
    });

    $$('[data-close-modal]').forEach(element => element.addEventListener('click', () => closeModal(els.materialModal)));
    $$('[data-close-preview]').forEach(element => element.addEventListener('click', () => closeModal(els.previewModal)));
    $('#previewButton').addEventListener('click', () => { els.yamlOutput.textContent = buildYaml(); openModal(els.previewModal); });
    $('#downloadButton').addEventListener('click', downloadYaml);
    $('#copyYamlButton').addEventListener('click', () => copyText(buildYaml(), 'YAML copied to clipboard'));

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeModal(els.materialModal);
        closeModal(els.previewModal);
      }
    });

    document.addEventListener('click', event => {
      const target = event.target.closest('.ripple');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.left = `${event.clientX - rect.left}px`;
      wave.style.top = `${event.clientY - rect.top}px`;
      target.appendChild(wave);
      wave.addEventListener('animationend', () => wave.remove());
    });
  }

  async function init() {
    renderLoreOptions();
    renderDropItems();
    updateGeneratorMaterial();
    updateHardnessRange();
    bindEvents();
    refresh();
    await loadMinecraftData();

    const loadedHay = state.blocks.find(block => block.name === 'hay_block');
    const loadedWheat = state.items.find(item => item.name === 'wheat');
    if (loadedHay) state.generatorMaterial = loadedHay;
    if (loadedWheat) state.dropItems[0].material = loadedWheat;
    updateGeneratorMaterial();
    renderDropItems();
    refresh();
  }

  init();
})();

