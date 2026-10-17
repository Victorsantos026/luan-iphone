
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ImagePlus,
  LogIn,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const money = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

const emptyProduct = {
  name: '',
  description: '',
  price_cash: '',
  price_card: '',
  storage: '',
  condition: 'Seminovo',
  available: true,
  featured: false,
  image_url: '',
}

export default function Admin() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyProduct)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInput = useRef(null)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) console.error(error)
      setSession(data?.session ?? null)
      setCheckingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) loadProducts()
  }, [session])

  async function handleLogin(event) {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoginLoading(false)

    if (error) {
      setLoginError('Não foi possível entrar. Confira seu e-mail e sua senha.')
      return
    }

    setSession(data.session)
    setPassword('')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
    setProducts([])
  }

  async function loadProducts() {
    setLoadingProducts(true)
    setPageError('')

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setPageError('Não foi possível carregar os produtos. Verifique as permissões da tabela no Supabase.')
    } else {
      setProducts(data || [])
    }

    setLoadingProducts(false)
  }

  function openNewProduct() {
    setEditingId(null)
    setForm({ ...emptyProduct })
    setImageFile(null)
    setImagePreview('')
    setNotice('')
    setModalOpen(true)
  }

  function openEditProduct(product) {
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      description: product.description || '',
      price_cash: product.price_cash ?? '',
      price_card: product.price_card ?? '',
      storage: product.storage || '',
      condition: product.condition || 'Seminovo',
      available: product.available ?? true,
      featured: product.featured ?? false,
      image_url: product.image_url || '',
    })
    setImageFile(null)
    setImagePreview(product.image_url || '')
    setNotice('')
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
    setImageFile(null)
    setImagePreview('')
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setNotice('Selecione um arquivo de imagem válido.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice('A imagem deve ter no máximo 5 MB.')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setNotice('')
  }

  async function uploadImage() {
    if (!imageFile) return form.image_url || ''

    const safeName = imageFile.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')

    const filePath = `${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: imageFile.type,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setNotice('')

    try {
      const image_url = await uploadImage()

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price_cash: Number(form.price_cash),
        price_card: Number(form.price_card || 0),
        storage: form.storage.trim(),
        condition: form.condition,
        available: Boolean(form.available),
        featured: Boolean(form.featured),
        image_url,
      }

      if (!payload.name) {
        throw new Error('Informe o nome do aparelho.')
      }

      if (form.price_cash === '' || !Number.isFinite(payload.price_cash) || payload.price_cash < 0) {
        throw new Error('Informe um preço à vista válido.')
      }

      let error

      if (editingId) {
        const result = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingId)

        error = result.error
      } else {
        const result = await supabase
          .from('products')
          .insert(payload)

        error = result.error
      }

      if (error) throw error

      setModalOpen(false)
      setImageFile(null)
      setImagePreview('')
      setNotice(editingId ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.')
      await loadProducts()
    } catch (error) {
      console.error(error)
      setNotice(error.message || 'Não foi possível salvar o produto. Verifique a configuração do Supabase.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Deseja realmente excluir "${product.name}"? Esta ação não pode ser desfeita.`,
    )

    if (!confirmed) return

    setPageError('')
    setNotice('')

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (error) {
      console.error(error)
      setPageError('Não foi possível excluir o produto. Verifique as permissões no Supabase.')
      return
    }

    setProducts((current) => current.filter((item) => item.id !== product.id))
    setNotice('Produto excluído com sucesso.')
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-center">
          <RefreshCw className="mx-auto animate-spin text-[#d4af37]" size={30} />
          <p className="mt-4 text-sm text-zinc-400">Verificando acesso...</p>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 py-12 text-white">
        <div className="pointer-events-none fixed -right-20 -top-20 h-80 w-80 rounded-full bg-[#d4af37]/10 blur-[100px]" />
        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#111] p-7 shadow-2xl sm:p-10">
          <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-[#d4af37]">
            <ArrowLeft size={16} />
            Voltar ao site oficial
          </a>

          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10">
            <Smartphone className="text-[#d4af37]" size={28} />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Luan iPhone
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Painel administrativo</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Entre com sua conta autorizada para gerenciar os aparelhos da loja.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm text-zinc-300">E-mail</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm text-zinc-300">Senha</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-[#d4af37]"
              />
            </div>

            {loginError && (
              <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d4af37] px-5 py-4 text-sm font-bold text-black transition hover:bg-[#f0d779] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={18} />
              {loginLoading ? 'Entrando...' : 'Entrar no painel'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-zinc-600">
            O acesso é feito pela autenticação do Supabase. Não existe cadastro público nesta página.
          </p>
        </div>
      </main>
    )
  }

  const availableCount = products.filter((product) => product.available).length

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-white/10 bg-[#0c0c0c]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10">
              <Package size={22} className="text-[#d4af37]" />
            </div>
            <div>
              <p className="font-bold">LUAN <span className="text-[#d4af37]">IPHONE</span></p>
              <p className="mt-1 text-xs text-zinc-500">Painel administrativo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="hidden items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-[#d4af37]/50 hover:text-white sm:inline-flex"
            >
              <ArrowLeft size={16} />
              Ver site
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-red-500/40 hover:text-red-300"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">Gerenciamento da loja</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Seus aparelhos</h1>
            <p className="mt-3 text-sm text-zinc-400">Cadastre, edite e controle os produtos exibidos no site oficial.</p>
          </div>

          <button
            onClick={openNewProduct}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d4af37] px-6 py-3.5 text-sm font-bold text-black transition hover:bg-[#f0d779]"
          >
            <Plus size={18} />
            Adicionar aparelho
          </button>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total de aparelhos', value: products.length, icon: Package },
            { label: 'Disponíveis na loja', value: availableCount, icon: Smartphone },
            { label: 'Indisponíveis', value: products.length - availableCount, icon: X },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-[#111] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{item.label}</p>
                <item.icon size={20} className="text-[#d4af37]" />
              </div>
              <p className="mt-4 text-3xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        {notice && (
          <div className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/[0.07] p-4 text-sm text-[#e5cb6d]">
            <p>{notice}</p>
            <button onClick={() => setNotice('')} aria-label="Fechar aviso">
              <X size={17} />
            </button>
          </div>
        )}

        {pageError && (
          <div role="alert" className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {pageError}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
            <h2 className="font-semibold">Catálogo de produtos</h2>
            <button
              onClick={loadProducts}
              disabled={loadingProducts}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:border-[#d4af37]/50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingProducts ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {loadingProducts ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-zinc-400">
              <RefreshCw size={18} className="animate-spin text-[#d4af37]" />
              Carregando produtos...
            </div>
          ) : products.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Smartphone size={40} className="mx-auto text-zinc-600" />
              <h3 className="mt-4 font-semibold">Nenhum aparelho cadastrado</h3>
              <p className="mt-2 text-sm text-zinc-500">Clique em “Adicionar aparelho” para começar.</p>
              <button
                onClick={openNewProduct}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/40 px-5 py-3 text-sm font-semibold text-[#d4af37] hover:bg-[#d4af37]/10"
              >
                <Plus size={17} />
                Cadastrar primeiro aparelho
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {products.map((product) => (
                <article key={product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" />
                    ) : (
                      <Smartphone size={30} className="text-zinc-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.featured && (
                        <span className="rounded-full bg-[#d4af37]/10 px-2.5 py-1 text-[10px] font-bold uppercase text-[#d4af37]">
                          Destaque
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${product.available ? 'bg-emerald-500/10 text-emerald-300' : 'bg-zinc-700/40 text-zinc-400'}`}>
                        {product.available ? 'Disponível' : 'Indisponível'}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                      {[product.storage, product.condition].filter(Boolean).join(' · ') || 'Sem detalhes adicionais'}
                    </p>

                    <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <p className="font-semibold text-[#d4af37]">{money(product.price_cash)} <span className="text-xs font-normal text-zinc-500">à vista</span></p>
                      {Number(product.price_card) > 0 && (
                        <p className="text-sm text-zinc-400">Cartão: {money(product.price_card)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => openEditProduct(product)}
                      aria-label={`Editar ${product.name}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-[#d4af37]/50 hover:text-[#d4af37]"
                    >
                      <Pencil size={15} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      aria-label={`Excluir ${product.name}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 p-2.5 text-zinc-400 transition hover:border-red-500/40 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-xs leading-6 text-zinc-600">
          As alterações só serão gravadas se sua conta tiver as permissões necessárias no Supabase. Novos produtos disponíveis aparecerão no site oficial após o carregamento do catálogo.
        </p>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <section className="my-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                  Catálogo
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {editingId ? 'Editar aparelho' : 'Cadastrar aparelho'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                aria-label="Fechar formulário"
                className="rounded-full border border-white/10 p-2 text-zinc-400 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-5 sm:p-7">
              <div>
                <label className="mb-2 block text-sm text-zinc-300">Foto do aparelho</label>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex min-h-40 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black/30 p-4 transition hover:border-[#d4af37]/50"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Prévia do aparelho" className="h-44 max-w-full object-contain" />
                  ) : (
                    <>
                      <ImagePlus size={32} className="text-[#d4af37]" />
                      <span className="mt-3 text-sm font-medium">Selecionar imagem</span>
                      <span className="mt-1 text-xs text-zinc-500">PNG, JPG ou WEBP · Máximo 5 MB</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                      updateField('image_url', '')
                      if (fileInput.current) fileInput.current.value = ''
                    }}
                    className="mt-2 text-xs text-zinc-400 underline hover:text-white"
                  >
                    Remover imagem
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="product-name" className="mb-2 block text-sm text-zinc-300">Nome do aparelho *</label>
                <input
                  id="product-name"
                  required
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Ex.: iPhone 15 Pro Max"
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label htmlFor="product-description" className="mb-2 block text-sm text-zinc-300">Descrição</label>
                <textarea
                  id="product-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Detalhes do aparelho, estado de conservação, bateria..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="product-cash" className="mb-2 block text-sm text-zinc-300">Preço à vista (R$) *</label>
                  <input
                    id="product-cash"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price_cash}
                    onChange={(event) => updateField('price_cash', event.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label htmlFor="product-card" className="mb-2 block text-sm text-zinc-300">Preço no cartão (R$)</label>
                  <input
                    id="product-card"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_card}
                    onChange={(event) => updateField('price_card', event.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="product-storage" className="mb-2 block text-sm text-zinc-300">Armazenamento</label>
                  <select
                    id="product-storage"
                    value={form.storage}
                    onChange={(event) => updateField('storage', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#d4af37]"
                  >
                    <option value="">Não informado</option>
                    <option value="64 GB">64 GB</option>
                    <option value="128 GB">128 GB</option>
                    <option value="256 GB">256 GB</option>
                    <option value="512 GB">512 GB</option>
                    <option value="1 TB">1 TB</option>
                    <option value="2 TB">2 TB</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="product-condition" className="mb-2 block text-sm text-zinc-300">Condição</label>
                  <select
                    id="product-condition"
                    value={form.condition}
                    onChange={(event) => updateField('condition', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#d4af37]"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Seminovo">Seminovo</option>
                    <option value="Usado">Usado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(event) => updateField('available', event.target.checked)}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                  Aparelho disponível para venda
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) => updateField('featured', event.target.checked)}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                  Destacar aparelho no catálogo
                </label>
              </div>

              {notice && (
                <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {notice}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d4af37] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#f0d779] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar aparelho'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
