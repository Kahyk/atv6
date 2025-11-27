// FRONT-END app.js
// Ajuste BASE_URL se seu backend mudar (host/porta)
const BASE_URL = 'http://18.216.121.236:3000';

const productsList = document.getElementById('products');
const addForm = document.getElementById('add-product-form');

const btnSearch = document.getElementById('btnSearch');
const searchId = document.getElementById('searchId');
const searchResult = document.getElementById('searchResult');

const refreshBtn = document.getElementById('refreshBtn');

const idUpdate = document.getElementById('idUpdate');
const nameUpdate = document.getElementById('nameUpdate');
const descUpdate = document.getElementById('descriptionUpdate');
const priceUpdate = document.getElementById('priceUpdate');
const btnUpdate = document.getElementById('btnUpdate');

// ---------- helpers ----------
function escapeHtml(str){ if(!str && str !== 0) return ''; return String(str).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

async function handleResponseError(res){
  if(!res.ok){
    const text = await res.text().catch(()=>null);
    throw new Error(text || `HTTP ${res.status}`);
  }
}

// ---------- CRUD: CREATE ----------
addForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const description = document.getElementById('description').value.trim();
  const price = parseFloat(document.getElementById('price').value);

  if(!name || !description || Number.isNaN(price)){
    alert('Preencha todos os campos corretamente.');
    return;
  }

  try{
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, description, price })
    });

    await handleResponseError(res);
    // opcional: limpar form
    addForm.reset();
    await fetchProducts();
    alert('Produto criado com sucesso!');
  }catch(err){
    console.error(err);
    alert('Erro ao criar produto: ' + err.message);
  }
});

// ---------- CRUD: READ ALL ----------
async function fetchProducts(){
  productsList.innerHTML = '<li>Carregando...</li>';
  try{
    const res = await fetch(`${BASE_URL}/products`);
    await handleResponseError(res);
    const data = await res.json();

    renderProducts(Array.isArray(data) ? data : []);
  }catch(err){
    console.error(err);
    productsList.innerHTML = `<li>Erro ao carregar produtos: ${escapeHtml(err.message)}</li>`;
  }
}

// ---------- Render list ----------
function renderProducts(items){
  if(!items || !items.length){
    productsList.innerHTML = '<li>Nenhum produto cadastrado.</li>';
    return;
  }

  productsList.innerHTML = '';
  items.forEach(item=>{
    const li = document.createElement('li');

    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `<strong>${escapeHtml(item.name)}</strong>
                      <div class="small">(#${escapeHtml(item.id)})</div>
                      <div class="desc">${escapeHtml(item.description)}</div>
                      <div class="price">R$ ${Number(item.price).toFixed(2)}</div>`;

    const controls = document.createElement('div');
    controls.className = 'controls';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn edit';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', ()=> showEditRow(li, item));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn delete';
    delBtn.textContent = 'Excluir';
    delBtn.addEventListener('click', ()=> deleteProduct(item.id));

    controls.appendChild(editBtn);
    controls.appendChild(delBtn);

    li.appendChild(info);
    li.appendChild(controls);

    productsList.appendChild(li);
  });
}

// ---------- SHOW EDIT ROW (inline) ----------
function showEditRow(containerLi, item){
  // evita duplicar
  if(containerLi.querySelector('.editRow')) return;

  const row = document.createElement('div');
  row.className = 'editRow';

  const nameIn = document.createElement('input'); nameIn.value = item.name;
  const descIn = document.createElement('input'); descIn.value = item.description;
  const priceIn = document.createElement('input'); priceIn.type='number'; priceIn.step='0.01'; priceIn.value=item.price;

  const save = document.createElement('button'); save.className='btn edit-save'; save.textContent='Salvar';
  const cancel = document.createElement('button'); cancel.className='btn edit-cancel'; cancel.textContent='Cancelar';

  save.onclick = async ()=>{
    try{
      const newName = nameIn.value.trim();
      const newDesc = descIn.value.trim();
      const newPrice = parseFloat(priceIn.value);

      if(!newName || Number.isNaN(newPrice)){
        alert('Nome e preço válidos são obrigatórios.');
        return;
      }

      const res = await fetch(`${BASE_URL}/products/${item.id}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name:newName, description:newDesc, price:newPrice })
      });
      await handleResponseError(res);
      await fetchProducts();
      alert('Produto atualizado!');
    }catch(err){
      console.error(err);
      alert('Erro ao atualizar: '+err.message);
    }
  };

  cancel.onclick = ()=> row.remove();

  row.appendChild(nameIn);
  row.appendChild(descIn);
  row.appendChild(priceIn);
  row.appendChild(save);
  row.appendChild(cancel);

  containerLi.appendChild(row);
}

// ---------- DELETE ----------
async function deleteProduct(id){
  if(!confirm('Deseja realmente excluir?')) return;
  try{
    const res = await fetch(`${BASE_URL}/products/${id}`, { method:'DELETE' });
    await handleResponseError(res);
    await fetchProducts();
    alert('Excluído com sucesso');
  }catch(err){
    console.error(err);
    alert('Erro ao excluir: '+err.message);
  }
}

// ---------- FETCH BY ID (compatível com backend Express que retorna objeto OR array) ----------
async function fetchProductById(id){
  // Faz a chamada para /products/:id (seja o backend retornando array ou obj)
  const res = await fetch(`${BASE_URL}/products/${id}`);
  await handleResponseError(res);
  const data = await res.json();

  // data pode ser: objeto (quando backend usa .single()) OR array (quando backend retorna [item])
  if(!data) return null;
  if(Array.isArray(data)){
    if(data.length === 0) return null;
    return data[0];
  }
  return data;
}

// botão de busca
btnSearch.addEventListener('click', async ()=>{
  const id = searchId.value.trim();
  searchResult.innerHTML = '';
  if(!id){ searchResult.innerHTML = '<div class="small">Digite um ID válido</div>'; return; }

  try{
    const item = await fetchProductById(id);
    if(!item){
      searchResult.innerHTML = '<div class="small">Produto não encontrado.</div>';
      return;
    }
    searchResult.innerHTML = `
      <div style="padding:8px; border-radius:8px; background:#f8fafc">
        <strong>${escapeHtml(item.name)}</strong> <div class="small">(#${escapeHtml(item.id)})</div>
        <div class="desc">${escapeHtml(item.description)}</div>
        <div class="price">R$ ${Number(item.price).toFixed(2)}</div>
      </div>
    `;
  }catch(err){
    console.error(err);
    searchResult.innerHTML = `<div class="small">Erro ao consultar: ${escapeHtml(err.message)}</div>`;
  }
});

// ---------- UPDATE via painel (botão) ----------
btnUpdate.addEventListener('click', async ()=>{
  const id = idUpdate.value.trim();
  const nameVal = nameUpdate.value.trim();
  const descVal = descUpdate.value.trim();
  const priceVal = priceUpdate.value;

  if(!id){ alert('Informe o ID para atualizar'); return; }
  if(!nameVal || !descVal || priceVal === ''){ alert('Preencha todos os campos de atualização'); return; }

  try{
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: nameVal, description: descVal, price: Number(priceVal) })
    });
    await handleResponseError(res);
    alert('Produto atualizado com sucesso');
    // opcional: limpar campos de update
    idUpdate.value=''; nameUpdate.value=''; descUpdate.value=''; priceUpdate.value='';
    await fetchProducts();
  }catch(err){
    console.error(err);
    alert('Erro ao atualizar: '+err.message);
  }
});

// ---------- refresh listener ----------
refreshBtn.addEventListener('click', fetchProducts);

// inicializa lista
fetchProducts();
