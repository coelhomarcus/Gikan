import { Settings01 } from "@untitledui/icons";
import { useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Topbar } from "@/components/layout/topbar";
import { useProject } from "@/features/projects/hooks/use-project";

export const ProjectBoardPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: project } = useProject(projectId!);

    return (
        <>
            <Topbar
                title={project?.name ?? "Board"}
                actions={
                    <Button href={`/projects/${projectId}/settings`} color="secondary" size="sm" iconLeading={Settings01}>
                        Configurações
                    </Button>
                }
            />
            <div className="p-4 lg:p-6">
                <p className="text-tertiary">Em breve.</p>
            </div>
        </>
    );
};
