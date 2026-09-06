import { ArrowLeft } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";

export function NotFound() {
    const router = useNavigate();

    return (
        <section className="flex min-h-screen items-start bg-primary py-16 md:items-center md:py-24">
            <div className="mx-auto max-w-container grow px-4 md:px-8">
                <div className="flex w-full max-w-3xl flex-col gap-8 md:gap-12">
                    <div className="flex flex-col gap-4 md:gap-6">
                        <div className="flex flex-col gap-3">
                            <span className="text-md font-semibold text-brand-secondary">Erro 404</span>
                            <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">Não encontramos essa página</h1>
                        </div>
                        <p className="text-lg text-tertiary md:text-xl">A página que você procura não existe ou foi movida.</p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <Button color="secondary" size="xl" iconLeading={ArrowLeft} onClick={() => router(-1)}>
                            Voltar
                        </Button>
                        <Button size="xl" onClick={() => router("/")}>
                            Ir para o início
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
