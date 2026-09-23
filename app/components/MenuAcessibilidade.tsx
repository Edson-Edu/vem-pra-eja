"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PersonStanding, Contrast, Hand, Volume2, X, type LucideIcon } from "lucide-react";
import { definirEstadoVLibras, observarEstadoVLibras, obterEstadoVLibras } from "./estadoVLibras";
import { definirMenuAcessibilidade, useMenuAcessibilidadeAberto } from "./estadoMenuAcessibilidade";
import { prepararAudioNoGestoUsuario, useAudioDescricao } from "./useAudioDescricao";
import { tamanhosTexto, useTamanhoTexto } from "./useTamanhoTexto";

const textoDoMenu = "Acessibilidade. Tamanho do texto: padrão, grande ou muito grande. Alto contraste: aumenta o contraste das cores da tela. Tradução em Libras: mostra um intérprete virtual. Leitura em voz alta: lê o conteúdo da tela para você. Áudio e Libras são usados um de cada vez. Ao ligar um, o outro é desligado automaticamente. O alto contraste pode permanecer ligado.";
const textoAtualDaTela = () => document.querySelector<HTMLElement>("[data-eja-audio-texto]")?.dataset.ejaAudioTexto || textoDoMenu;

export default function MenuAcessibilidade() {
  const aberto = useMenuAcessibilidadeAberto();
  const dialogo = useRef<HTMLDialogElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const [contraste, setContraste] = useState(false);
  const { tamanho, escolher } = useTamanhoTexto();
  const libras = useSyncExternalStore(observarEstadoVLibras, obterEstadoVLibras, () => false);
  const { ativo: audio, carregando, alternar, falarAgora, interromper } = useAudioDescricao();

  useEffect(() => {
    const atualizar = () => setContraste(document.documentElement.classList.contains("alto-contraste"));
    atualizar();
    const observador = new MutationObserver(atualizar);
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const elemento = dialogo.current;
    const acionador = botao.current;
    const overflowAnterior = document.body.style.overflow;
    elemento?.showModal();
    window.dispatchEvent(new Event("vp-disable-text-capture"));
    document.body.style.overflow = "hidden";
    void falarAgora(textoDoMenu);
    return () => {
      elemento?.close();
      if (obterEstadoVLibras()) window.dispatchEvent(new Event("vp-enable-text-capture"));
      document.body.style.overflow = overflowAnterior;
      acionador?.focus();
    };
  }, [aberto, falarAgora]);

  const fechar = () => {
    interromper();
    definirMenuAcessibilidade(false);
    if (audio) void falarAgora(textoAtualDaTela());
  };

  const alternarAudio = () => {
    // O estado muda antes da requisição. Mesmo durante o carregamento é
    // possível desligar e cancelar a leitura, sem ficar preso no menu.
    void alternar(textoAtualDaTela());
  };

  return (
    <>
      <button ref={botao} type="button" className="eja-acessibilidade-abrir" aria-haspopup="dialog" aria-expanded={aberto} aria-controls="eja-menu-acessibilidade" onClick={() => definirMenuAcessibilidade(true)}>
        <PersonStanding aria-hidden="true" size={21} />
        <span>Acessibilidade</span>
      </button>
      <dialog ref={dialogo} id="eja-menu-acessibilidade" className="eja-acessibilidade-dialogo" aria-labelledby="eja-menu-titulo" onCancel={(evento) => { evento.preventDefault(); fechar(); }} onKeyDown={(evento) => { if (evento.key === "Escape") { evento.preventDefault(); fechar(); } }} onClick={(evento) => { if (evento.target === evento.currentTarget) fechar(); }}>
        <div className="eja-acessibilidade-painel">
          <span className="eja-acessibilidade-alca" aria-hidden="true" />
          <div className="eja-acessibilidade-cabecalho">
            <h2 id="eja-menu-titulo">Acessibilidade</h2>
            <button type="button" aria-label="Fechar acessibilidade" onClick={fechar}><X aria-hidden="true" size={22} /></button>
          </div>
          <Controle id="contraste" icone={Contrast} titulo="Alto contraste" descricao="Aumenta o contraste das cores da tela." ligado={contraste} onAlternar={() => document.querySelector<HTMLButtonElement>("[data-eja-alto-contraste]")?.click()} />
          <fieldset className="eja-tamanho-texto">
            <legend>Tamanho do texto</legend>
            <p>Escolha o tamanho mais confortável para ler.</p>
            <div>
              {tamanhosTexto.map((valor, indice) => <label key={valor}>
                <input type="radio" name="eja-tamanho-texto" value={valor} checked={tamanho === valor} onChange={() => { escolher(valor); void falarAgora(`Texto ${["padrão", "grande", "muito grande"][indice]}. ${valor} por cento.`); }} />
                <span>{["Padrão", "Grande", "Muito grande"][indice]}<small>{valor}%</small></span>
              </label>)}
            </div>
          </fieldset>
          <div className="eja-acessibilidade-grupo">
          <Controle id="libras" icone={Hand} titulo="Tradução em Libras (VLibras)" descricao="Mostra um intérprete virtual traduzindo o conteúdo." ligado={libras} onAlternar={() => definirEstadoVLibras(!libras)} />
          <Controle id="audio" icone={Volume2} titulo="Leitura em voz alta" descricao="O site lê o conteúdo da tela para você." ligado={audio} onPreparar={prepararAudioNoGestoUsuario} onAlternar={alternarAudio} />
          <p className="eja-acessibilidade-status eja-acessibilidade-orientacao" data-vlibras-texto="Áudio e Libras são usados um de cada vez. Ao ligar um, o outro é desligado automaticamente. O alto contraste pode permanecer ligado.">Opte por Libras ou Leitura em voz alta</p>
          </div>
          <p className="eja-acessibilidade-status eja-acessibilidade-retorno" data-ativo={audio || libras} role="status">{audio && carregando ? "Preparando áudio. Você pode desligar a leitura a qualquer momento." : libras ? "Libras ligado; leitura em voz alta desligada. Feche este menu para usar o intérprete na página." : audio ? "Leitura em voz alta ligada; Libras desligado." : "Você pode mudar essas opções a qualquer momento."}</p>
          <button type="button" className="eja-acessibilidade-concluir" onClick={fechar}>Voltar à página</button>
        </div>
      </dialog>
    </>
  );
}

function Controle({ id, icone: Icone, titulo, descricao, ligado, onAlternar, onPreparar }: {
  id: string; icone: LucideIcon; titulo: string; descricao: string; ligado: boolean; onAlternar: () => void; onPreparar?: () => void;
}) {
  return (
    <button type="button" role="switch" aria-checked={ligado} aria-labelledby={`eja-${id}-titulo`} aria-describedby={`eja-${id}-descricao`} className="eja-acessibilidade-opcao" onPointerDown={onPreparar} onClick={onAlternar}>
      <span className="eja-acessibilidade-icone"><Icone aria-hidden="true" size={22} /></span>
      <span className="eja-acessibilidade-texto"><strong id={`eja-${id}-titulo`}>{titulo}</strong><span id={`eja-${id}-descricao`}>{descricao}</span></span>
      <span className="eja-acessibilidade-chave" aria-hidden="true"><span className="eja-acessibilidade-trilho"><span /></span><span>{ligado ? "Ligado" : "Desligado"}</span></span>
    </button>
  );
}
