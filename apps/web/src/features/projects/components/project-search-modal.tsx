import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Input } from "@/components/base/input/input";
import { LoadingState } from "@/components/feedback/loading-state";
import { useIssues } from "@/features/issues/hooks/use-issues";
import { useProjects } from "../hooks/use-projects";
import { ProjectIcon } from "./project-icon";
import { useTranslation } from "react-i18next";

interface ProjectSearchModalProps {
    onClose: () => void;
}

type SearchResult =
    | { type: "project"; id: string; title: string; key: string; description: string | null; icon: string | null }
    | { type: "issue"; id: string; title: string; key: string; description: string | null; icon: null }
    | { type: "command"; id: string; title: string; key: string; description: string; icon: null; path: string };

export const ProjectSearchModal = ({ onClose }: ProjectSearchModalProps) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { data: projects } = useProjects();
    const location = useLocation();
    const navigate = useNavigate();
    const activeProjectId = location.pathname.match(/^\/projects\/([^/]+)/)?.[1];
    const { data: issues, isLoading: issuesLoading } = useIssues(activeProjectId ?? "");

    const results = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        const projectResults: SearchResult[] = (projects ?? [])
            .filter((project) => !normalized || `${project.name} ${project.issueKey} ${project.description ?? ""}`.toLowerCase().includes(normalized))
            .map((project) => ({ type: "project", id: project.id, title: project.name, key: project.issueKey, description: project.description, icon: project.icon }));
        const issueResults: SearchResult[] = (issues ?? [])
            .filter((issue) => !normalized || `${issue.identifier} ${issue.title}`.toLowerCase().includes(normalized))
            .map((issue) => ({ type: "issue", id: issue.identifier, title: issue.title, key: issue.identifier, description: null, icon: null }));
        const commandResults: SearchResult[] = activeProjectId
            ? [
                  { type: "command" as const, id: "issues", title: t("search.openIssues"), key: t("search.navigation"), description: t("search.browseIssues"), icon: null, path: `/projects/${activeProjectId}/issues` },
                  { type: "command" as const, id: "board", title: t("search.openBoard"), key: t("search.navigation"), description: t("search.moveIssues"), icon: null, path: `/projects/${activeProjectId}/board` },
                  { type: "command" as const, id: "documents", title: t("search.openDocuments"), key: t("search.navigation"), description: t("search.openProjectDocument"), icon: null, path: `/projects/${activeProjectId}/documents` },
              ].filter((command) => !normalized || `${command.title} ${command.description}`.toLowerCase().includes(normalized))
            : [];
        return { projects: projectResults, issues: issueResults, commands: commandResults, all: [...projectResults, ...issueResults, ...commandResults] };
    }, [activeProjectId, issues, projects, query, t]);

    useEffect(() => setSelectedIndex(0), [query]);
    useEffect(() => setSelectedIndex((index) => Math.min(index, Math.max(results.all.length - 1, 0))), [results.all.length]);
    useEffect(() => {
        if (results.all[selectedIndex]) {
            document.getElementById(resultDomId(results.all[selectedIndex]))?.scrollIntoView({ block: "nearest" });
        }
    }, [results.all, selectedIndex]);

    function openResult(result: SearchResult) {
        if (result.type === "project") {
            navigate(`/projects/${result.id}`);
        } else if (activeProjectId) {
            navigate(result.type === "command" ? result.path : `/projects/${activeProjectId}/issues/${result.id}`, result.type === "command" ? undefined : { state: { backgroundLocation: location } });
        }
        onClose();
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((index) => Math.min(index + 1, Math.max(results.all.length - 1, 0)));
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((index) => Math.max(index - 1, 0));
        }
        if (event.key === "Enter" && results.all[selectedIndex]) openResult(results.all[selectedIndex]);
    }

    const isLoading = !projects || (Boolean(activeProjectId) && issuesLoading);

    return (
        <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="max-w-lg">
                <Dialog>
                    <div className="flex max-h-[70vh] w-full flex-col overflow-hidden rounded-xl bg-surface-1 shadow-xl ring-1 ring-subtle">
                        <div className="border-b border-subtle p-3">
                            <Input
                                autoFocus
                                aria-label={t("search.searchProjectsAndIssues")}
                                inputProps={{
                                    "aria-controls": "gikan-search-results",
                                    "aria-activedescendant": results.all[selectedIndex] ? resultDomId(results.all[selectedIndex]) : undefined,
                                    "aria-expanded": "true",
                                    role: "combobox",
                                }}
                                placeholder={t("search.searchProjectsAndIssues")}
                                icon={Search}
                                value={query}
                                onChange={setQuery}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        <div id="gikan-search-results" role="listbox" aria-label={t("search.results")} className="flex flex-col overflow-y-auto p-2">
                            {isLoading ? (
                                <LoadingState label={t("search.searching")} className="px-3 py-4" />
                            ) : results.all.length === 0 ? (
                                <p className="p-4 text-center text-sm text-tertiary">{projects.length === 0 ? t("search.noProjects") : t("search.noResults")}</p>
                            ) : (
                                <>
                                    {results.projects.length > 0 && <ResultGroup label={t("nav.projects")} results={results.projects} selectedIndex={selectedIndex} offset={0} onOpen={openResult} />}
                                    {results.issues.length > 0 && (
                                        <div className="mt-2">
                                            <ResultGroup label={t("search.issuesInProject")} results={results.issues} selectedIndex={selectedIndex} offset={results.projects.length} onOpen={openResult} />
                                        </div>
                                    )}
                                    {results.commands.length > 0 && (
                                        <div className="mt-2">
                                            <ResultGroup label={t("search.commands")} results={results.commands} selectedIndex={selectedIndex} offset={results.projects.length + results.issues.length} onOpen={openResult} />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

function ResultGroup({ label, results, selectedIndex, offset, onOpen }: { label: string; results: SearchResult[]; selectedIndex: number; offset: number; onOpen: (result: SearchResult) => void }) {
    return (
        <section aria-label={label}>
            <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-tertiary">{label}</p>
            <div className="flex flex-col">
                {results.map((result, index) => {
                    const isSelected = selectedIndex === offset + index;
                    return (
                        <button
                            key={`${result.type}-${result.id}`}
                            type="button"
                            id={resultDomId(result)}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => onOpen(result)}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-left transition duration-100 ease-linear hover:bg-layer-1-hover ${isSelected ? "bg-surface-2" : ""}`}
                        >
                            {result.type === "project" ? <ProjectIcon icon={result.icon} className="size-4 shrink-0 text-placeholder" /> : result.type === "command" ? <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-placeholder" /> : <span className="flex size-4 shrink-0 items-center justify-center rounded border border-subtle text-[9px] text-placeholder">#</span>}
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="flex min-w-0 items-baseline gap-2">
                                    <span className="truncate text-sm font-medium text-primary">{result.title}</span>
                                    <span className="shrink-0 font-mono text-[11px] text-tertiary">{result.key}</span>
                                </span>
                                {result.description && <span className="line-clamp-1 text-xs text-tertiary">{result.description}</span>}
                            </span>
                            {isSelected && <span className="font-mono text-[11px] text-tertiary">↵</span>}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function resultDomId(result: SearchResult) {
    return `gikan-search-result-${result.type}-${result.id}`;
}
