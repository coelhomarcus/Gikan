const settings = {
        general: "General", states: "States", members: "Members", labels: "Labels", manageDetails: "Manage your project details.",
        defineWorkflow: "Define the workflow for your project.", managePeople: "Manage the people working on this project.",
        organizeIssues: "Organize and categorize your issues.", fullName: "Full name", username: "Username", email: "Email",
        workflow: "Workflow", loadingStates: "Loading states…", couldNotLoadStates: "Could not load the project states.", couldNotUpdateWorkflow: "Could not update the workflow.",
        addState: "Add state", stateName: "State name", noStates: "No states yet", addStateHint: "Add a state to start organizing issues.",
        moveStateUp: "Move state up", moveStateDown: "Move state down", deleteState: "Delete state", deleteStateDescription: "The state “{{name}}” will be deleted. Move its issues first; states with issues cannot be deleted.",
        addLabel: "Add label", labelName: "Label name", createLabelsDescription: "Create labels to help organize and filter issues in your project.", loadingLabels: "Loading labels…", couldNotLoadLabels: "Could not load the project labels.",
        noLabels: "No labels yet", createLabelHint: "Create a label to organize issues in this project.", deleteLabel: "Delete label", deleteLabelDescription: "The label “{{name}}” will be removed from all issues. The issues will not be deleted.", couldNotDeleteLabel: "Could not delete the label.",
        searchMembers: "Search members", addMember: "Add member", addMemberDescription: "Add an existing Gikan user to this project.", loadingMembers: "Loading members…", couldNotLoadMembers: "Could not load the project members.",
        noMembersFound: "No members found", noMembers: "No members yet", tryMemberSearch: "Try a different name, username, or email.", inviteTeammates: "Add teammates to collaborate on this project.",
        name: "Name", role: "Role", joinedOn: "Joined on", actions: "Actions", owner: "Owner", member: "Member", removeMember: "Remove member", removeMemberDescription: "{{name}} (@{{username}}) will lose access to this project. You can add them again later.",
        couldNotRemoveMember: "Could not remove the member.", couldNotAddMember: "Could not add the member.", projectDetailsSaved: "Project details saved.", couldNotSaveProject: "Could not save the project.",
        loadingProject: "Loading project…", couldNotLoadProject: "Could not load the project.", changeProjectIcon: "Change project icon", projectIcon: "Project icon", loadingIcons: "Loading icons…", projectIdLocked: "Locked after the first issue is created.",
        deleteProjectDescription: "Permanently remove this project and all of its data and resources. Deleted projects cannot be recovered.",
        newCycle: "New cycle", planCycleDescription: "Plan a focused period of work for this project.", cycleName: "Cycle name", starts: "Starts", ends: "Ends", createCycle: "Create cycle", loadingCycles: "Loading cycles…", couldNotLoadCycles: "Could not load the project cycles.",
        noCycles: "No cycles yet", createCycleHint: "Create a cycle to organize a focused period of work.", noCyclesAvailable: "This project does not have any cycles yet.", couldNotCreateCycle: "Could not create the cycle.", couldNotUpdateCycle: "Could not update the cycle.", couldNotDeleteCycle: "Could not delete the cycle.",
        deleteCycle: "Delete cycle", deleteCycleDescription: "The cycle “{{name}}” will be deleted. Issues in it will remain available.", editCycle: "Edit cycle", noPeriodSet: "No period set", planned: "Planned", active: "Active", completed: "Completed",
        newColumn: "New column", columnName: "Column name", color: "Color", colorValue: "Color {{color}}", customColor: "Custom color", chooseColor: "Choose color",
    } as const;

export default settings;
