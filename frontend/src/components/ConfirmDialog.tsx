// Diálogo de confirmação para ações destrutivas, como exclusão.

import { AlertTriangle } from "lucide-react";
import ProjectModal from "./ProjectModal";

interface Props {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  carregando?: boolean;
}

export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  aoConfirmar,
  aoCancelar,
  carregando = false,
}: Props) {
  return (
    <ProjectModal aberto={aberto} titulo={titulo} aoFechar={aoCancelar}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-slate-300">{mensagem}</p>
      </div>

      <div className="mt-6 flex flex-col-reverse items-center gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={aoCancelar}
          className="botao-secundario w-full sm:w-auto"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={aoConfirmar}
          disabled={carregando}
          className="botao-perigo w-full sm:w-auto"
        >
          {carregando ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </ProjectModal>
  );
}