
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  CheckCircle2,
  MapPin,
  Menu,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Zap,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

import logo from '../../assets/logo.png'
import instagramIcon from '../../assets/instagram.png'
import whatsappIcon from '../../assets/whatsapp.png'
import iphoneCover from '../../assets/iphone.png'

const PHONE = '5588999950441'
const INSTAGRAM = 'https://www.instagram.com/luaniphone/'

const money = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

function WhatsAppLink({
  children,
  message = 'Olá! Vim pelo site da Luan iPhone e gostaria de conhecer os aparelhos disponíveis.',
  className = '',
}) {
  const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#d4af37] px-6 py-3.5 text-sm font-bold text-black transition hover:scale-[1.02] hover:bg-[#f0d779] ${className}`}
    >
      {children}
    </a>
  )
}

function WhatsAppIcon({ className = 'h-5 w-5' }) {
  return (
    <img
      src={whatsappIcon}
      alt=""
      aria-hidden="true"
      className={`${className} shrink-0 object-contain`}
    />
  )
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">
        {eyebrow}
      </p>

      <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-4 leading-7 text-zinc-400">{description}</p>
      )}
    </div>
  )
}

function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false)

  const message = `Olá! Tenho interesse no ${product.name}${
    product.storage ? ` ${product.storage}` : ''
  }. Pode me passar mais informações?`

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45 }}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-[#111111] transition hover:border-[#d4af37]/50"
    >
      <div className="relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-b from-[#202020] to-[#101010] p-5">
        {product.featured && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-[#d4af37] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
            Destaque
          </span>
        )}

        {product.image_url && !imageError ? (
          <img
            src={product.image_url}
            alt={product.name || 'iPhone disponível'}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
          />
        ) : (
          <Smartphone
            size={92}
            strokeWidth={1}
            className="text-zinc-600"
          />
        )}
      </div>

      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {product.condition && (
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-300">
              {product.condition}
            </span>
          )}

          {product.storage && (
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-300">
              {product.storage}
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold text-white">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-2 min-h-10 text-sm leading-5 text-zinc-400">
            {product.description}
          </p>
        )}

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-xs text-zinc-500">À vista no Pix</p>

          <p className="mt-1 text-2xl font-bold text-[#d4af37]">
            {money(product.price_cash)}
          </p>

          {Number(product.price_card) > 0 && (
            <p className="mt-1 text-sm text-zinc-400">
              No cartão: {money(product.price_card)}
            </p>
          )}
        </div>

        <a
          href={`https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-[#d4af37]/60 px-4 py-3 text-sm font-bold text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Tenho interesse
          <ArrowUpRight size={16} />
        </a>
      </div>
    </motion.article>
  )
}

export default function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProducts() {
      setLoading(true)
      setLoadError(false)

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('available', true)
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false })

        if (!active) return

        if (error) {
          console.error('Erro ao carregar produtos:', error)
          setLoadError(true)
        } else {
          setProducts(data || [])
        }
      } catch (error) {
        if (!active) return

        console.error('Erro inesperado ao carregar produtos:', error)
        setLoadError(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [])

  const closeMenu = () => setMenuOpen(false)

  const navigation = [
    ['Início', '#inicio'],
    ['Aparelhos', '#aparelhos'],
    ['Sobre nós', '#sobre'],
    ['Contato', '#contato'],
  ]

  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Atendimento de confiança',
      text: 'Atenção em cada etapa da compra.',
    },
    {
      icon: Smartphone,
      title: 'Novos e seminovos',
      text: 'Opções para diferentes necessidades.',
    },
    {
      icon: MessageCircle,
      title: 'Atendimento direto',
      text: 'Tire suas dúvidas pelo WhatsApp.',
    },
  ]

  return (
    <main className="min-h-screen overflow-hidden bg-[#080808] text-white">
      {/* Navegação */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a
            href="#inicio"
            className="flex min-w-0 items-center gap-3"
            onClick={closeMenu}
          >
            <img
              src={logo}
              alt="Luan iPhone"
              className="h-12 w-12 shrink-0 rounded-xl object-contain"
            />

            <div className="min-w-0">
              <p className="text-base font-bold tracking-wide">
                LUAN <span className="text-[#d4af37]">IPHONE</span>
              </p>
              <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 sm:tracking-[0.2em]">
                Venda de iPhones novos e seminovos
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navigation.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-sm text-zinc-300 transition hover:text-[#d4af37]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <WhatsAppLink>
              <WhatsAppIcon />
              Fale conosco
            </WhatsAppLink>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            className="rounded-xl border border-white/10 p-2 md:hidden"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-white/10 bg-[#0b0b0b] px-5 py-5 md:hidden">
            {navigation.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={closeMenu}
                className="block border-b border-white/5 py-3 text-sm text-zinc-300 transition hover:text-[#d4af37]"
              >
                {label}
              </a>
            ))}

            <div className="mt-4">
              <WhatsAppLink>
                <WhatsAppIcon />
                Fale conosco
              </WhatsAppLink>
            </div>
          </nav>
        )}
      </header>

      {/* Capa */}
      <section
        id="inicio"
        className="relative flex min-h-[720px] items-center pt-24 sm:min-h-[780px]"
      >
        <div className="pointer-events-none absolute -right-40 top-24 h-[500px] w-[500px] rounded-full bg-[#d4af37]/[0.07] blur-[120px]" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[300px] w-[300px] rounded-full bg-amber-100/[0.03] blur-[100px]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/[0.07] px-4 py-2 text-xs font-medium text-[#e5cb6d]">
              <Zap size={14} />
              Há 8 anos realizando sonhos
            </div>

            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Seu próximo
              <br />
              iPhone está
              <br />
              <span className="bg-gradient-to-r from-[#f4df91] via-[#d4af37] to-[#9c7920] bg-clip-text text-transparent">
                aqui.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-base leading-8 text-zinc-400 sm:text-lg">
              iPhones novos e seminovos, atendimento de confiança e condições
              especiais para você escolher seu próximo aparelho.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#aparelhos"
                className="inline-flex items-center gap-2 rounded-full bg-[#d4af37] px-6 py-4 text-sm font-bold text-black transition hover:bg-[#f0d779]"
              >
                Ver aparelhos
                <ArrowUpRight size={17} />
              </a>

              <WhatsAppLink>
                <WhatsAppIcon />
                Falar no WhatsApp
              </WhatsAppLink>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/10 pt-7">
              <div>
                <p className="text-2xl font-semibold text-white">8 anos</p>
                <p className="mt-1 text-xs text-zinc-500">De experiência</p>
              </div>

              <div className="h-10 w-px bg-white/10" />

              <div>
                <p className="text-2xl font-semibold text-white">Qualidade</p>
                <p className="mt-1 text-xs text-zinc-500">Em cada escolha</p>
              </div>

              <div className="h-10 w-px bg-white/10" />

              <div>
                <p className="text-2xl font-semibold text-white">Confiança</p>
                <p className="mt-1 text-xs text-zinc-500">No atendimento</p>
              </div>
            </div>
          </motion.div>

          {/* Imagem principal do iPhone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative mx-auto flex min-h-[390px] w-full max-w-lg items-center justify-center sm:min-h-[500px]"
          >
            <div className="absolute h-[280px] w-[280px] rounded-full border border-[#d4af37]/10 sm:h-[420px] sm:w-[420px]" />
            <div className="absolute h-[230px] w-[230px] rounded-full border border-[#d4af37]/15 sm:h-[340px] sm:w-[340px]" />
            <div className="absolute h-[200px] w-[200px] rounded-full bg-[#d4af37]/10 blur-[65px] sm:h-[300px] sm:w-[300px]" />

            <img
              src={iphoneCover}
              alt="iPhone em destaque da Luan iPhone"
              fetchPriority="high"
              className="relative z-10 max-h-[470px] w-full max-w-[430px] object-contain drop-shadow-2xl sm:max-h-[540px]"
            />

            <div className="absolute bottom-4 right-0 z-20 max-w-[260px] rounded-2xl border border-white/10 bg-[#171717]/95 p-4 shadow-xl sm:bottom-8 sm:right-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#d4af37]/10 p-2.5">
                  <ShieldCheck className="text-[#d4af37]" size={24} />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Sua escolha, com confiança
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Atendimento personalizado
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="border-y border-white/10 bg-[#0d0d0d]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-3 sm:px-8">
          {benefits.map((item) => {
            const Icon = item.icon

            return (
              <div key={item.title} className="flex items-center gap-4">
                <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/[0.06] p-3">
                  <Icon size={22} className="text-[#d4af37]" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{item.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Catálogo */}
      <section
        id="aparelhos"
        className="scroll-mt-24 px-5 py-24 sm:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Nosso catálogo"
            title="Encontre seu próximo iPhone"
            description="Confira os aparelhos disponíveis e fale diretamente com nossa equipe para consultar condições e disponibilidade."
          />

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[480px] animate-pulse rounded-3xl border border-white/10 bg-[#111]"
                />
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-3xl border border-white/10 bg-[#111] px-6 py-12 text-center">
              <Smartphone
                size={36}
                className="mx-auto text-zinc-500"
              />
              <h3 className="mt-4 text-lg font-semibold">
                Não foi possível carregar os aparelhos
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Entre em contato pelo WhatsApp para consultar os modelos
                disponíveis.
              </p>

              <div className="mt-6">
                <WhatsAppLink>
                  <WhatsAppIcon />
                  Consultar aparelhos
                </WhatsAppLink>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#111] px-6 py-14 text-center">
              <Smartphone
                size={42}
                className="mx-auto text-[#d4af37]"
              />
              <h3 className="mt-5 text-xl font-semibold">
                Novidades em breve
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Entre em contato para consultar os iPhones disponíveis.
              </p>

              <div className="mt-6">
                <WhatsAppLink>
                  <WhatsAppIcon />
                  Consultar pelo WhatsApp
                </WhatsAppLink>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <p className="mt-8 text-center text-xs leading-6 text-zinc-600">
            Preços e disponibilidade sujeitos a alteração. Consulte as
            condições diretamente com a loja.
          </p>
        </div>
      </section>

      {/* Sobre a loja */}
      <section
        id="sobre"
        className="scroll-mt-24 border-y border-white/10 bg-[#0d0d0d] px-5 py-24 sm:px-8"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">
              Nossa história
            </p>

            <h2 className="text-3xl font-semibold leading-tight sm:text-5xl">
              Oito anos realizando sonhos através da tecnologia
            </h2>
          </div>

          <div>
            <p className="leading-8 text-zinc-400">
              A Luan iPhone trabalha para tornar a escolha do seu próximo
              aparelho uma experiência simples e segura. Nosso compromisso é
              oferecer atendimento próximo, esclarecer suas dúvidas e ajudar
              você a encontrar o iPhone ideal.
            </p>

            <div className="mt-7 space-y-4">
              {[
                'Atendimento personalizado',
                'Opções de aparelhos novos e seminovos',
                'Contato direto para consultar preços e condições',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2
                    size={19}
                    className="shrink-0 text-[#d4af37]"
                  />
                  <span className="text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#171717] to-[#0c0c0c] px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/10 p-3">
            <img
              src={instagramIcon}
              alt="Instagram"
              className="h-full w-full object-contain"
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">
            Acompanhe a loja
          </p>

          <h2 className="mt-3 text-3xl font-semibold">
            Fique por dentro das novidades
          </h2>

          <p className="mt-4 max-w-xl leading-7 text-zinc-400">
            Siga a Luan iPhone no Instagram para acompanhar novidades,
            aparelhos e atualizações da loja.
          </p>

          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold transition hover:border-[#d4af37] hover:text-[#d4af37]"
          >
            <img
              src={instagramIcon}
              alt=""
              aria-hidden="true"
              className="h-5 w-5 object-contain"
            />
            Acessar Instagram
            <ArrowUpRight size={17} />
          </a>
        </div>
      </section>

      {/* Contato */}
      <section
        id="contato"
        className="scroll-mt-24 px-5 pb-24 sm:px-8"
      >
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#d4af37] via-[#e3c65f] to-[#b58e25] p-8 text-black sm:p-12 lg:p-16">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em]">
                Vamos conversar?
              </p>

              <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
                Seu próximo iPhone começa com uma mensagem
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-black/70">
                Fale com a nossa equipe, tire suas dúvidas e consulte os
                modelos disponíveis.
              </p>
            </div>

            <a
              href={`https://wa.me/${PHONE}?text=${encodeURIComponent(
                'Olá! Gostaria de conhecer os iPhones disponíveis na Luan iPhone.',
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-white transition hover:bg-zinc-800"
            >
              <WhatsAppIcon />
              Chamar no WhatsApp
              <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-white/10 bg-[#050505] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Luan iPhone"
              className="h-12 w-12 object-contain"
            />

            <div>
              <p className="font-bold tracking-wide">
                LUAN <span className="text-[#d4af37]">IPHONE</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Há 8 anos realizando sonhos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <MapPin size={16} className="text-[#d4af37]" />
            Juazeiro do Norte – CE
          </div>

          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Luan iPhone. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>

      {/* WhatsApp flutuante */}
      <a
        href={`https://wa.me/${PHONE}?text=${encodeURIComponent(
          'Olá! Vim pelo site da Luan iPhone.',
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com a Luan iPhone pelo WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffffff] p-3 text-white shadow-2xl transition hover:scale-105"
      >
        <WhatsAppIcon className="h-full w-full" />
      </a>
    </main>
  )
}
