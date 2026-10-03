let items=JSON.parse(localStorage.getItem("wishlist_v4")||"[]");

// 保存されたカテゴリ一覧を取得（初期値がなければデフォルトのいくつかを用意）
let categories=JSON.parse(localStorage.getItem("wishlist_categories")||'["電子機器", "ファッション", "本", "その他"]');

let editingId=null,deletingId=null,currentImageData="";

// 前回保存された選択状態を復元
let selectedCategory = localStorage.getItem("wishlist_cat") || "all";
document.getElementById("filterStatus").value = localStorage.getItem("wishlist_status") || "all";
document.getElementById("sort").value = localStorage.getItem("wishlist_sort") || "manual";
document.getElementById("search").value = localStorage.getItem("wishlist_search") || "";

const statusLabel={
wanted:"欲しい",considering:"検討中",planned:"購入予定",
bought:"購入済み",hold:"保留",lost:"欲しくなくなった"
};
const priorityLabel={high:"🔥 最優先",medium:"🟡 欲しい",low:"⚪ いつか欲しい"};
const yen=n=>"¥"+Number(n||0).toLocaleString("ja-JP");

function save(){
  localStorage.setItem("wishlist_v4",JSON.stringify(items));
  render();
}

function saveCategories(){
  localStorage.setItem("wishlist_categories",JSON.stringify(categories));
  render();
}

// フィルターや検索が変わったときに状態をキープする
function onFilterChange(){
  localStorage.setItem("wishlist_status", document.getElementById("filterStatus").value);
  localStorage.setItem("wishlist_sort", document.getElementById("sort").value);
  localStorage.setItem("wishlist_search", document.getElementById("search").value);
  render();
}

function previewImage(){
 const f=document.getElementById("image").files[0],p=document.getElementById("preview");
 if(!f){p.style.display="none";return}
 const r=new FileReader();
 r.onload=()=>{currentImageData=r.result;p.src=r.result;p.style.display="block"};
 r.readAsDataURL(f);
}

function saveItem(){
 const name=document.getElementById("name").value.trim();
 const price=Number(document.getElementById("price").value);
 if(!name){alert("商品名を入力してください");return}
 if(isNaN(price)||price<0){alert("価格を入力してください");return}

 const data={
 name,price,
 url:document.getElementById("url").value.trim(),
 category:document.getElementById("category").value,
 memo:document.getElementById("memo").value.trim(),
 image:currentImageData,
 desire:Number(document.getElementById("desire").value),
 priority:document.getElementById("priority").value,
 status:document.getElementById("status").value,
 date:document.getElementById("date").value
 };

 if(editingId){
   const i=items.findIndex(x=>x.id===editingId);
   items[i]={...items[i],...data};
 }else{
   items.push({id:Date.now().toString(),...data,created:Date.now(),order:items.length});
 }
 cancelEdit();save();
}

function editItem(id){
 const x=items.find(i=>i.id===id);if(!x)return;
 editingId=id;currentImageData=x.image||"";
 document.getElementById("formTitle").textContent="アイテムを編集";
 document.getElementById("name").value=x.name;
 document.getElementById("price").value=x.price;
 document.getElementById("url").value=x.url||"";
 document.getElementById("category").value=x.category||categories[0];
 document.getElementById("memo").value=x.memo||"";
 document.getElementById("desire").value=x.desire;
 document.getElementById("priority").value=x.priority;
 document.getElementById("status").value=x.status;
 document.getElementById("date").value=x.date||"";
 const p=document.getElementById("preview");
 if(x.image){p.src=x.image;p.style.display="block"}else p.style.display="none";
 document.querySelector(".primary").textContent="変更を保存";
 document.getElementById("cancel").style.display="block";
 window.scrollTo({top:0,behavior:"smooth"});
}

function cancelEdit(){
 editingId=null;currentImageData="";
 document.getElementById("formTitle").textContent="新しいアイテムを追加";
 ["name","price","url","memo","date","image"].forEach(k=>document.getElementById(k).value="");
 document.getElementById("category").value=categories[0];
 document.getElementById("desire").value="3";
 document.getElementById("priority").value="medium";
 document.getElementById("status").value="wanted";
 document.getElementById("preview").style.display="none";
 document.querySelector(".primary").textContent="追加する";
 document.getElementById("cancel").style.display="none";
}

function changeStatus(id,status){
 const x=items.find(i=>i.id===id);if(!x)return;
 x.status=status;save();
}
function moveItem(id,dir){
 const visible=[...items].sort((a,b)=>(a.order??0)-(b.order??0));
 const idx=visible.findIndex(x=>x.id===id),to=idx+dir;
 if(idx<0||to<0||to>=visible.length)return;
 const a=visible[idx],b=visible[to],tmp=a.order;
 a.order=b.order;b.order=tmp;save();
}
function askDelete(id){deletingId=id;document.getElementById("modal").classList.add("show")}
function closeModal(){deletingId=null;document.getElementById("modal").classList.remove("show")}
function confirmDelete(){items=items.filter(x=>x.id!==deletingId);closeModal();save()}

// カテゴリ管理モーダル制御
function openCategoryModal(){
 renderCategoryManageList();
 document.getElementById("categoryModal").classList.add("show");
}
function closeCategoryModal(){
 document.getElementById("categoryModal").classList.remove("show");
}
function addCategory(){
 const input=document.getElementById("newCategoryName");
 const val=input.value.trim();
 if(!val)return;
 if(categories.includes(val)){alert("すでに存在するカテゴリです");return;}
 categories.push(val);
 input.value="";
 saveCategories();
 renderCategoryManageList();
}
function deleteCategory(cat){
 if(categories.length<=1){alert("カテゴリは最低1つ必要です");return;}
 if(confirm(`「${cat}」を削除しますか？\n(このカテゴリのアイテムは「その他」に変更されます)`)){
   categories=categories.filter(c=>c!==cat);
   if(!categories.includes("other")) categories.push("その他");
   items.forEach(x=>{if(x.category===cat)x.category="その他";});
   if(selectedCategory===cat)selectedCategory="all";
   save();
   saveCategories();
   renderCategoryManageList();
 }
}
function renderCategoryManageList(){
 const container=document.getElementById("categoryManageList");
 container.innerHTML=categories.map(cat=>`
   <div style="display:flex;justify-content:space-between;align-items:center;background:var(--input-bg);padding:8px 12px;border-radius:8px;border:1px solid var(--border-color);">
     <span style="font-size:14px">${escapeHtml(cat)}</span>
     <button onclick="deleteCategory('${escapeHtml(cat)}')" style="background:transparent;color:#ff4d4d;padding:4px 8px;font-size:12px;border:none">削除</button>
   </div>
 `).join("");
}

function exportData(){
 const backup={items,categories};
 const dataStr="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(backup));
 const downloadAnchor=document.createElement('a');
 downloadAnchor.setAttribute("href", dataStr);
 downloadAnchor.setAttribute("download", "wishlist_backup.json");
 document.body.appendChild(downloadAnchor);
 downloadAnchor.click();
 downloadAnchor.remove();
}

function importData(event){
 const file=event.target.files[0];
 if(!file)return;
 const reader=new FileReader();
 reader.onload=function(e){
   try{
     const imported=JSON.parse(e.target.result);
     if(Array.isArray(imported)){
       // 古い形式のバックアップの場合
       if(confirm("現在のデータに上書きしますか？\n「OK」で復元を実行します。")){
         items=imported;
         save();
         alert("データを正常に復元しました！");
       }
     }else if(imported.items && Array.isArray(imported.items)){
       if(confirm("現在のデータに上書きしますか？\n「OK」で復元を実行します。")){
         items=imported.items;
         if(imported.categories) categories=imported.categories;
         saveCategories();
         save();
         alert("データを正常に復元しました！");
       }
     }else{
       alert("ファイル形式が正しくありません。");
     }
   }catch(err){
     alert("JSONファイルの読み込みに失敗しました。");
   }
   event.target.value="";
 };
 reader.readAsText(file);
}

function renderCategorySelect(){
 const select=document.getElementById("category");
 const currentVal=select.value;
 select.innerHTML=categories.map(cat=>`<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join("");
 if(categories.includes(currentVal)) select.value=currentVal;
}

function renderCategoryTabs(){
 renderCategorySelect();
 const container=document.getElementById("categoryTabs");
 const cats=["all", ...categories];
 
 container.innerHTML=cats.map(cat=>{
   const label=cat==="all"?"すべて":cat;
   const active=selectedCategory===cat?"active":"";
   return `<button class="cat-tab ${active}" onclick="selectCategory('${cat}')">${label}</button>`;
 }).join("");
}

function selectCategory(cat){
 selectedCategory=cat;
 localStorage.setItem("wishlist_cat", cat);
 render();
}

function render(){
 renderCategoryTabs();

 const q=document.getElementById("search").value.toLowerCase();
 const f=document.getElementById("filterStatus").value;
 let arr=items.filter(x=>{
   const cat=x.category||"その他";
   const matchCat=selectedCategory==="all"||cat===selectedCategory;
   const text=(x.name+" "+cat+" "+(x.memo||"")).toLowerCase();
   const matchQuery=text.includes(q);
   let state=true;
   if(f==="active")state=x.status!=="bought"&&x.status!=="lost";
   else if(f!=="all")state=x.status===f;
   return matchCat&&matchQuery&&state;
 });

 const s=document.getElementById("sort").value;
 if(s==="manual")arr.sort((a,b)=>(a.order??0)-(b.order??0));
 if(s==="priority"){const p={high:0,medium:1,low:2};arr.sort((a,b)=>p[a.priority]-p[b.priority]||b.desire-a.desire)}
 if(s==="desire")arr.sort((a,b)=>b.desire-a.desire);
 if(s==="priceAsc")arr.sort((a,b)=>a.price-b.price);
 if(s==="priceDesc")arr.sort((a,b)=>b.price-a.price);
 if(s==="date")arr.sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999"));
 if(s===“new”)arr.sort((a,b)=>b.created-a.created);

 document.getElementById("list").innerHTML=arr.length?arr.map((x,i)=>{
   const img=x.image?`<img class="thumb" src="${x.image}" alt="">`:`<div class="noimg">画像なし</div>`;
   return `<article class="item ${x.priority} ${x.status==="bought"?"done":""}">
   ${img}
   <div style="flex:1;min-width:180px">
     <div class="title">${escapeHtml(x.name)}</div>
     <div class="meta">
       <span class="tag">${escapeHtml(x.category)}</span>
       <span class="tag">${priorityLabel[x.priority]}</span>
       <span class="tag">${"⭐".repeat(x.desire)}</span>
       <span class="tag">${statusLabel[x.status]}</span>
       ${x.date?`<span class="tag">購入予定：${x.date}</span>`:""}
     </div>
     ${x.url?`<a class="link" href="${escapeAttr(x.url)}" target="_blank" rel="noopener">🔗 商品ページを開く</a>`:""}
     ${x.memo?`<div class="memo">${escapeHtml(x.memo)}</div>`:""}
   </div>
   <div>
     <div class="price">${yen(x.price)}</div>
     <div class="actions">
       <button onclick="moveItem('${x.id}',-1)" title="上へ">↑</button>
       <button onclick="moveItem('${x.id}',1)" title="下へ">↓</button>
       <button onclick="editItem('${x.id}')">編集</button>
       <button class="buy" onclick="changeStatus('${x.id}','${x.status==="bought"?"wanted":"bought"}')">${x.status==="bought"?"未購入に戻す":"購入済みにする"}</button>
       <button onclick="askDelete('${x.id}')">削除</button>
     </div>
   </div>
   </article>`
 }).join(""):`<div class="card empty">該当するほしい物がありません。</div>`;

 const active=items.filter(x=>x.status!=="bought"&&x.status!=="lost");
 const done=items.filter(x=>x.status==="bought");
 document.getElementById("count").textContent=active.length;
 document.getElementById("total").textContent=yen(active.reduce((s,x)=>s+x.price,0));
 document.getElementById("bought").textContent=done.length;
 document.getElementById("spent").textContent=yen(done.reduce((s,x)=>s+x.price,0));
}

function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function escapeAttr(s){return escapeHtml(s).replace(/javascript:/gi,"")}
render();