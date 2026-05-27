/**
 * i18n translations.
 *
 * Šiame faile saugomi visi UI tekstai dviem kalbom: lietuvių (lt) ir anglų (en).
 * Norint pridėti naują tekstą:
 *   1. Pridėti naują raktą į `TranslationKey` tipą.
 *   2. Įrašyti reikšmę abiejose kalbose žemiau esančiame `translations` objekte.
 *   3. Komponente naudoti: `const { t } = useLanguage(); t('your.key');`
 */

export type Language = 'lt' | 'en';
export const SUPPORTED_LANGUAGES: Language[] = ['lt', 'en'];
export const DEFAULT_LANGUAGE: Language = 'lt';

export type TranslationKey =
  // Bendri / common
  | 'common.loading'
  | 'common.cancel'
  | 'common.save'
  | 'common.saving'
  | 'common.delete'
  | 'common.deleting'
  | 'common.edit'
  | 'common.close'
  | 'common.create'
  | 'common.creating'
  | 'common.update'
  | 'common.updating'
  | 'common.confirm'
  | 'common.back'
  | 'common.next'
  | 'common.search'
  | 'common.yes'
  | 'common.no'
  | 'common.error'
  | 'common.success'
  | 'common.required'
  | 'common.optional'
  | 'common.add'
  | 'common.remove'
  | 'common.actions'
  | 'common.status'
  | 'common.name'
  | 'common.description'
  | 'common.date'
  | 'common.from'
  | 'common.to'
  | 'common.all'
  | 'common.none'
  | 'common.unknown'
  | 'common.retry'
  | 'common.refresh'
  | 'common.tryAgain'
  | 'common.openMenu'
  | 'common.unauthorized'
  | 'common.notFound'
  | 'common.justNow'
  | 'common.minuteAgo'
  | 'common.minutesAgo'
  | 'common.hourAgo'
  | 'common.hoursAgo'
  | 'common.dayAgo'
  | 'common.daysAgo'

  // Header
  | 'header.themeToggle.toLight'
  | 'header.themeToggle.toDark'
  | 'header.themeToggle.srLabel'
  | 'header.languageToggle.title'
  | 'header.languageToggle.srLabel'
  | 'header.adminPanel'
  | 'header.notifications'
  | 'header.openMenu'
  | 'header.navigation'

  // Notifications
  | 'notifications.dropdownTitle'
  | 'notifications.markAllRead'
  | 'notifications.empty'
  | 'notifications.emptyDescription'
  | 'notifications.loading'
  | 'notifications.unreadBadge'
  | 'notifications.workItemAssigned.title'
  | 'notifications.workItemAssigned.message'
  | 'notifications.blockerResolved.title'
  | 'notifications.blockerResolved.message'
  | 'notifications.addedToTeam.title'
  | 'notifications.addedToTeam.message'
  | 'notifications.addedToOrganization.title'
  | 'notifications.addedToOrganization.message'
  | 'notifications.passwordReset.title'
  | 'notifications.passwordReset.message'
  | 'notifications.preferences.title'
  | 'notifications.preferences.description'
  | 'notifications.preferences.master'
  | 'notifications.preferences.masterDescription'
  | 'notifications.preferences.workItemAssigned'
  | 'notifications.preferences.blockerResolved'
  | 'notifications.preferences.addedToTeam'
  | 'notifications.preferences.addedToOrganization'
  | 'notifications.preferences.passwordResetNote'
  | 'notifications.preferences.savedToast'
  | 'notifications.preferences.errorToast'

  // Markdown
  | 'markdown.helperText'
  | 'markdown.tabEdit'
  | 'markdown.tabPreview'
  | 'markdown.emptyPlaceholder'

  // Vartotojo meniu
  | 'user.profile'
  | 'user.logout'
  | 'user.fallbackName'

  // Sidebar
  | 'sidebar.dashboard'
  | 'sidebar.pinned'
  | 'sidebar.myOrganizations'
  | 'sidebar.recentPages'
  | 'sidebar.logout'
  | 'sidebar.editProfile'

  // Auth
  | 'auth.welcomeBack'
  | 'auth.signInSubtitle'
  | 'auth.signIn'
  | 'auth.signingIn'
  | 'auth.emailAddress'
  | 'auth.emailPlaceholder'
  | 'auth.password'
  | 'auth.passwordPlaceholder'
  | 'auth.forgotPassword'
  | 'auth.passwordResetSuccess'
  | 'auth.emailNotConfirmed'
  | 'auth.emailNotConfirmedMessage'
  | 'auth.resendConfirmation'
  | 'auth.sending'
  | 'auth.confirmationLinkSent'
  | 'auth.failedToSend'
  | 'auth.dontHaveAccount'
  | 'auth.createOne'
  | 'auth.showPassword'
  | 'auth.hidePassword'
  | 'auth.loginFailed'
  | 'auth.createAccount'
  | 'auth.signUpSubtitle'
  | 'auth.fullName'
  | 'auth.fullNamePlaceholder'
  | 'auth.confirmPassword'
  | 'auth.signUp'
  | 'auth.signingUp'
  | 'auth.alreadyHaveAccount'
  | 'auth.signInLink'
  | 'auth.passwordsDontMatch'
  | 'auth.registrationFailed'
  | 'auth.passwordRequirementsNotMet'
  | 'auth.pwdReqLength'
  | 'auth.pwdReqUpper'
  | 'auth.pwdReqLower'
  | 'auth.pwdReqNumber'
  | 'auth.forgotTitle'
  | 'auth.forgotSubtitle'
  | 'auth.sendResetLink'
  | 'auth.sendingResetLink'
  | 'auth.resetLinkSent'
  | 'auth.backToSignIn'
  | 'auth.resetTitle'
  | 'auth.resetSubtitle'
  | 'auth.newPassword'
  | 'auth.changePassword'
  | 'auth.changingPassword'
  | 'auth.checkEmailTitle'
  | 'auth.checkEmailSubtitle'
  | 'auth.confirmingEmail'
  | 'auth.emailConfirmed'
  | 'auth.confirmFailed'
  | 'auth.goToLogin'
  | 'auth.invalidResetLink'
  | 'auth.resetTokenMissing'
  | 'auth.resetTokenInvalid'
  | 'auth.openInbox'
  | 'auth.didntReceive'
  | 'auth.weWillRedirect'

  // Validation
  | 'validation.emailRequired'
  | 'validation.emailInvalid'
  | 'validation.passwordRequired'
  | 'validation.passwordTooShort'
  | 'validation.nameRequired'
  | 'validation.confirmPasswordRequired'
  | 'validation.fieldRequired'
  | 'validation.tooShort'
  | 'validation.tooLong'
  | 'validation.dateInvalid'
  | 'validation.endBeforeStart'

  // Dashboard
  | 'dashboard.title'
  | 'dashboard.welcome'
  | 'dashboard.myTeams'
  | 'dashboard.noTeams'
  | 'dashboard.viewAll'
  | 'dashboard.recentActivity'
  | 'dashboard.upcomingAbsences'
  | 'dashboard.assignedToMe'
  | 'dashboard.noAssignedItems'
  | 'dashboard.activeIterations'
  | 'dashboard.noActiveIterations'
  | 'dashboard.recentItems'
  | 'dashboard.noRecentItems'
  | 'dashboard.upcomingDeadlines'
  | 'dashboard.noUpcomingDeadlines'
  | 'dashboard.myOrganizations'
  | 'dashboard.noOrganizations'
  | 'dashboard.createOrganization'
  | 'dashboard.invitations'
  | 'dashboard.noInvitations'
  | 'dashboard.greetingMorning'
  | 'dashboard.greetingAfternoon'
  | 'dashboard.greetingEvening'
  | 'dashboard.sectionWork'
  | 'dashboard.sectionWorkspace'
  | 'dashboard.sectionQuickAccess'
  | 'dashboard.noPinnedTeams'
  | 'dashboard.noProducts'
  | 'dashboard.noTeamsInProduct'
  | 'dashboard.noRecentActivity'
  | 'dashboard.activity.createdItem'
  | 'dashboard.activity.updatedItem'
  | 'dashboard.activity.commented'
  | 'dashboard.blockedWork'
  | 'dashboard.noBlockedWork'
  | 'dashboard.blockedBy'
  | 'dashboard.blockerDone'
  | 'dashboard.blockerNotDone'
  | 'dashboard.unfinishedBlockers'

  // Organizations
  | 'organizations.title'
  | 'organizations.create'
  | 'organizations.createTitle'
  | 'organizations.createDescription'
  | 'organizations.created'
  | 'organizations.deleted'
  | 'organizations.namePlaceholder'
  | 'organizations.descriptionPlaceholder'
  | 'organizations.members'
  | 'organizations.member'
  | 'organizations.addMember'
  | 'organizations.addMemberTitle'
  | 'organizations.addMemberDescription'
  | 'organizations.removeMember'
  | 'organizations.invitations'
  | 'organizations.pendingInvitations'
  | 'organizations.noPendingInvitations'
  | 'organizations.acceptInvitation'
  | 'organizations.declineInvitation'
  | 'organizations.role'
  | 'organizations.roleOwner'
  | 'organizations.roleAdmin'
  | 'organizations.roleMember'
  | 'organizations.invite'
  | 'organizations.inviteSent'
  | 'organizations.invited'
  | 'organizations.leave'
  | 'organizations.leaveConfirm'
  | 'organizations.deleteConfirm'
  | 'organizations.deleteWarning'
  | 'organizations.noOrganizations'
  | 'organizations.createFirst'
  | 'organizations.products'
  | 'organizations.teams'
  | 'organizations.settings'
  | 'organizations.overview'
  | 'organizations.failedLoad'
  | 'organizations.failedCreate'
  | 'organizations.failedDelete'
  | 'organizations.failedInvite'
  | 'organizations.memberRemoved'
  | 'organizations.memberInvited'
  | 'organizations.roleUpdated'
  | 'organizations.failedRoleUpdate'
  | 'organizations.changeRoleConfirm'
  | 'organizations.cannotChangeOwnRole'
  | 'organizations.cannotChangeOwnerRole'
  | 'organizations.cannotChangeOtherAdminRole'
  | 'organizations.email'
  | 'organizations.absence'
  | 'organizations.activeMembers'
  | 'organizations.manageAbsences'
  | 'organizations.registerAbsence'
  | 'organizations.noAccess'
  | 'organizations.tags'
  | 'organizations.addTag'
  | 'organizations.tagNamePlaceholder'
  | 'organizations.noTags'
  | 'organizations.tagCreated'
  | 'organizations.tagDeleted'
  | 'organizations.failedCreateTag'
  | 'organizations.failedDeleteTag'
  | 'organizations.roleViewer'
  | 'organizations.slug'

  // Products
  | 'products.title'
  | 'products.create'
  | 'products.createTitle'
  | 'products.created'
  | 'products.updated'
  | 'products.deleted'
  | 'products.editTitle'
  | 'products.namePlaceholder'
  | 'products.descriptionPlaceholder'
  | 'products.owner'
  | 'products.organization'
  | 'products.status'
  | 'products.statusActive'
  | 'products.statusArchived'
  | 'products.statusDraft'
  | 'products.deleteConfirm'
  | 'products.noProducts'
  | 'products.createFirst'
  | 'products.failedLoad'
  | 'products.failedCreate'
  | 'products.failedUpdate'
  | 'products.failedDelete'
  | 'products.backlog'
  | 'products.board'
  | 'products.metrics'
  | 'products.team'
  | 'products.iterations'
  | 'products.overview'
  | 'products.details'
  | 'products.productId'
  | 'products.createdBy'
  | 'products.updatedBy'

  // Teams
  | 'teams.title'
  | 'teams.create'
  | 'teams.updated'
  | 'teams.memberAdded'
  | 'teams.memberRemoved'
  | 'teams.createTitle'
  | 'teams.editTitle'
  | 'teams.namePlaceholder'
  | 'teams.descriptionPlaceholder'
  | 'teams.members'
  | 'teams.lead'
  | 'teams.capacity'
  | 'teams.capacityHours'
  | 'teams.addMember'
  | 'teams.addMemberTitle'
  | 'teams.removeMember'
  | 'teams.removeMemberConfirm'
  | 'teams.deleteConfirm'
  | 'teams.noTeams'
  | 'teams.createFirst'
  | 'teams.failedLoad'
  | 'teams.failedCreate'
  | 'teams.failedUpdate'
  | 'teams.failedDelete'
  | 'teams.role'
  | 'teams.roleLead'
  | 'teams.roleMember'
  | 'teams.roleAdmin'
  | 'teams.roleViewer'
  | 'teams.cannotChangeOwnRole'
  | 'teams.cannotChangeCreatorRole'
  | 'teams.cannotChangeOtherAdminRole'
  | 'teams.roleCreator'
  | 'teams.information'
  | 'teams.teamId'
  | 'teams.created'
  | 'teams.lastUpdated'
  | 'teams.createdBy'
  | 'teams.noMembers'

  // Backlog
  | 'backlog.selected'
  | 'backlog.moveTo'
  | 'backlog.movingItems'
  | 'backlog.title'
  | 'backlog.addItem'
  | 'backlog.createItemTitle'
  | 'backlog.editItemTitle'
  | 'backlog.itemTitle'
  | 'backlog.itemTitlePlaceholder'
  | 'backlog.itemDescription'
  | 'backlog.itemDescriptionPlaceholder'
  | 'backlog.type'
  | 'backlog.typeStory'
  | 'backlog.typeBug'
  | 'backlog.typeTask'
  | 'backlog.typeEpic'
  | 'backlog.priority'
  | 'backlog.priorityLow'
  | 'backlog.priorityMedium'
  | 'backlog.priorityHigh'
  | 'backlog.priorityCritical'
  | 'backlog.status'
  | 'backlog.statusNew'
  | 'backlog.statusInProgress'
  | 'backlog.statusReview'
  | 'backlog.statusDone'
  | 'backlog.blockedStatusHint'
  | 'backlog.statusBlocked'
  | 'backlog.points'
  | 'backlog.assignee'
  | 'backlog.unassigned'
  | 'backlog.tags'
  | 'backlog.addTag'
  | 'backlog.filters'
  | 'backlog.sortBy'
  | 'backlog.noItems'
  | 'backlog.searchPlaceholder'
  | 'backlog.iteration'
  | 'backlog.createIteration'
  | 'backlog.editIteration'
  | 'backlog.completeIteration'
  | 'backlog.iterationName'
  | 'backlog.iterationStartDate'
  | 'backlog.iterationEndDate'
  | 'backlog.iterationGoal'
  | 'backlog.dependencies'
  | 'backlog.addDependency'
  | 'backlog.dependencyType'
  | 'backlog.blocks'
  | 'backlog.blockedBy'
  | 'backlog.relatesTo'
  | 'backlog.duplicates'
  | 'backlog.deleteItemConfirm'
  | 'backlog.failedLoad'
  | 'backlog.failedCreate'
  | 'backlog.failedUpdate'
  | 'backlog.failedDelete'
  | 'backlog.completeConfirm'
  | 'backlog.moveUnfinishedTo'
  | 'backlog.dependencyDetails'
  | 'backlog.removeDependency'
  | 'backlog.transferItem'
  | 'backlog.transferItemConfirm'
  | 'backlog.transferItemTitle'
  | 'backlog.transferItemDescription'
  | 'backlog.transferItemTargetLabel'
  | 'backlog.transferItemTargetPlaceholder'
  | 'backlog.transferItemSelectedLabel'
  | 'backlog.transferItemLoading'
  | 'backlog.transferItemNoTeams'
  | 'backlog.transferItemNoProductTeams'
  | 'backlog.transferItemSubmitting'
  | 'backlog.transferItemSuccess'
  | 'backlog.transferItemUnauthorized'
  | 'backlog.transferItemFailedLoad'
  | 'backlog.transferItemFailed'
  | 'backlog.editItemDescription'
  | 'backlog.allTypes'
  | 'backlog.allStatuses'
  | 'backlog.allAssignees'
  | 'backlog.allTags'
  | 'backlog.statusBacklog'
  | 'backlog.statusTodo'
  | 'backlog.dragHelp'
  | 'backlog.dragHere'
  | 'backlog.showCompleted'
  | 'backlog.completedCount'
  | 'backlog.comments'
  | 'backlog.commentsLoading'
  | 'backlog.commentsEmpty'
  | 'backlog.commentsEdited'
  | 'backlog.commentsPlaceholder'
  | 'backlog.commentsPosting'
  | 'backlog.commentsPost'
  | 'backlog.commentsDeleteTitle'
  | 'backlog.commentsDeleteDesc'
  | 'backlog.commentsFailedAdd'
  | 'backlog.commentsFailedUpdate'
  | 'backlog.commentsFailedDelete'
  | 'backlog.iterationStatusPlanning'
  | 'backlog.iterationStatusActive'
  | 'backlog.iterationStatusCompleted'
  | 'backlog.startIteration'
  | 'backlog.addItemsFirst'
  | 'backlog.doneCount'

  // ATPA – Automatinis Task'ų Priskyrimo Algoritmas
  | 'atpa.suggestButton'
  | 'atpa.title'
  | 'atpa.subtitle'
  | 'atpa.loading'
  | 'atpa.empty'
  | 'atpa.allAssigned'
  | 'atpa.applyAll'
  | 'atpa.applyingAll'
  | 'atpa.apply'
  | 'atpa.applying'
  | 'atpa.reject'
  | 'atpa.confidence'
  | 'atpa.matchingTags'
  | 'atpa.reason'
  | 'atpa.warnings'
  | 'atpa.warningOverloaded'
  | 'atpa.warningOversized'
  | 'atpa.warningUnmatched'
  | 'atpa.warningNoCapacity'
  | 'atpa.unassigned'
  | 'atpa.unassignedHint'
  | 'atpa.capacity'
  | 'atpa.capacityBefore'
  | 'atpa.capacityAfter'
  | 'atpa.scheduleFullTime'
  | 'atpa.schedulePartTime'
  | 'atpa.scheduleCustom'
  | 'atpa.suggestedFor'
  | 'atpa.failedLoad'
  | 'atpa.appliedToast'
  | 'atpa.partialAppliedToast'
  | 'atpa.failedApply'
  | 'atpa.noActiveIteration'

  // ATPA — backend warning codes (stable, used as i18n keys)
  | 'atpa.code.NO_TEAM_MEMBERS'
  | 'atpa.code.NO_TAG_MATCH'
  | 'atpa.code.SP_EXCEEDS_CAPACITY'
  | 'atpa.code.ALL_MEMBERS_OVERLOADED'
  | 'atpa.code.MEMBER_OVERLOADED'

  // ATPA — backend reason codes (joined into the suggestion's reason line)
  | 'atpa.reason.NO_TAGS_CAPACITY_BASED'
  | 'atpa.reason.TAG_FULL_MATCH'
  | 'atpa.reason.TAG_PARTIAL_MATCH'
  | 'atpa.reason.TAG_INFERRED_FULL'
  | 'atpa.reason.TAG_INFERRED_PARTIAL'
  | 'atpa.reason.TAG_MIXED_MATCH'
  | 'atpa.reason.TAG_NO_MATCH'
  | 'atpa.reason.CAPACITY_HIGH'
  | 'atpa.reason.CAPACITY_MEDIUM'
  | 'atpa.reason.CAPACITY_LOW'

  // ATPA — unassigned reason codes
  | 'atpa.unassignedReason.OVERSIZED'
  | 'atpa.unassignedReason.ALL_FULL'
  | 'atpa.unassignedReason.ALL_FULL_NO_SP'

  // Board
  | 'board.title'
  | 'board.todo'
  | 'board.inProgress'
  | 'board.review'
  | 'board.done'
  | 'board.blocked'
  | 'board.noItemsInColumn'
  | 'board.noActiveIteration'
  | 'board.selectIteration'
  | 'board.dragHint'
  | 'board.blockerError'
  | 'board.blockerErrorMessage'
  | 'board.cannotMoveBlocked'
  | 'board.failedLoad'
  | 'board.failedMove'
  | 'board.noTags'

  // Metrics
  | 'metrics.title'
  | 'metrics.velocity'
  | 'metrics.velocityDescription'
  | 'metrics.burndown'
  | 'metrics.burndownDescription'
  | 'metrics.burnup'
  | 'metrics.capacity'
  | 'metrics.capacityDescription'
  | 'metrics.sprintProgress'
  | 'metrics.sprintProgressDescription'
  | 'metrics.throughput'
  | 'metrics.cycleTime'
  | 'metrics.leadTime'
  | 'metrics.completed'
  | 'metrics.remaining'
  | 'metrics.committed'
  | 'metrics.inProgress'
  | 'metrics.dateRange'
  | 'metrics.lastNSprints'
  | 'metrics.points'
  | 'metrics.day'
  | 'metrics.ideal'
  | 'metrics.actual'
  | 'metrics.noData'
  | 'metrics.failedLoad'

  // Absences
  | 'absences.title'
  | 'absences.create'
  | 'absences.createTitle'
  | 'absences.editTitle'
  | 'absences.type'
  | 'absences.typeVacation'
  | 'absences.typeSick'
  | 'absences.typePersonal'
  | 'absences.typeOther'
  | 'absences.startDate'
  | 'absences.endDate'
  | 'absences.startTime'
  | 'absences.endTime'
  | 'absences.timeRange'
  | 'absences.reason'
  | 'absences.reasonPlaceholder'
  | 'absences.status'
  | 'absences.statusPending'
  | 'absences.statusApproved'
  | 'absences.statusRejected'
  | 'absences.approve'
  | 'absences.reject'
  | 'absences.deleteConfirm'
  | 'absences.noAbsences'
  | 'absences.failedLoad'
  | 'absences.failedCreate'
  | 'absences.failedUpdate'
  | 'absences.failedDelete'
  | 'absences.registerAbsence'
  | 'absences.searchMember'
  | 'absences.clear'
  | 'absences.allTypes'
  | 'absences.typeFilterPlaceholder'
  | 'absences.typeAbsent'
  | 'absences.typeLate'
  | 'absences.subtitle'
  | 'absences.noResults'
  | 'absences.noActiveMembership'

  // Profile
  | 'profile.title'
  | 'profile.personalInfo'
  | 'profile.preferences'
  | 'profile.security'
  | 'profile.fullName'
  | 'profile.email'
  | 'profile.role'
  | 'profile.avatar'
  | 'profile.changeAvatar'
  | 'profile.removeAvatar'
  | 'profile.language'
  | 'profile.theme'
  | 'profile.notifications'
  | 'profile.changePassword'
  | 'profile.currentPassword'
  | 'profile.newPassword'
  | 'profile.confirmNewPassword'
  | 'profile.saved'
  | 'profile.failedSave'
  | 'profile.deleteAccount'
  | 'profile.deleteAccountConfirm'

  // Admin
  | 'admin.usersTitle'
  | 'admin.systemTitle'
  | 'admin.sidebarUsers'
  | 'admin.sidebarSystem'
  | 'admin.sidebarFeedback'
  | 'admin.allUsers'
  | 'admin.addUser'
  | 'admin.editUser'
  | 'admin.deleteUser'
  | 'admin.deleteUserConfirm'
  | 'admin.suspend'
  | 'admin.activate'
  | 'admin.role'
  | 'admin.roleAdmin'
  | 'admin.roleUser'
  | 'admin.status'
  | 'admin.statusActive'
  | 'admin.statusSuspended'
  | 'admin.lastLogin'
  | 'admin.never'
  | 'admin.systemHealth'
  | 'admin.systemVersion'
  | 'admin.systemUptime'
  | 'admin.totalUsers'
  | 'admin.activeUsers'
  | 'admin.totalOrganizations'
  | 'admin.totalProducts'
  | 'admin.failedLoad'
  | 'admin.search'
  | 'admin.sidebarOrganizations'
  | 'admin.totalTeams'
  | 'admin.totalWorkItems'
  | 'admin.totalIterations'
  | 'admin.usersTotal'
  | 'admin.usersNewThisWeek'
  | 'admin.usersNewThisMonth'
  | 'admin.usersBlocked'
  | 'admin.usersUnconfirmed'
  | 'admin.workItemsByStatus'
  | 'admin.lastRefresh'
  | 'admin.rawJson'
  | 'admin.healthHealthy'
  | 'admin.healthDegraded'
  | 'admin.healthUnhealthy'
  | 'admin.healthConnected'
  | 'admin.healthConnectionFailed'
  | 'admin.healthResponseTime'
  | 'admin.healthHighUsage'
  | 'admin.healthNormalUsage'
  | 'admin.healthOverall'
  | 'admin.orgsTitle'
  | 'admin.orgsDescription'
  | 'admin.orgsSearchPlaceholder'
  | 'admin.orgsColMembers'
  | 'admin.orgsColProducts'
  | 'admin.orgsColTeams'
  | 'admin.orgsColCreated'
  | 'admin.orgsColLastActivity'
  | 'admin.orgsNotFound'
  | 'admin.orgsUnknown'
  | 'admin.orgsNever'
  | 'admin.orgsViewDetails'
  | 'admin.orgsDeleteOrg'
  | 'admin.orgsDetailTitle'
  | 'admin.orgsDetailCreated'
  | 'admin.orgsDetailSlug'
  | 'admin.orgsDetailMembers'
  | 'admin.orgsDetailProducts'
  | 'admin.orgsNoProducts'
  | 'admin.orgsNoTeams'
  | 'admin.orgsDeleteTitle'
  | 'admin.orgsDeleteConfirm'
  | 'admin.orgsDeleting'
  | 'admin.orgsDeletePermanently'
  | 'admin.orgsFailedLoad'
  | 'admin.orgsFailedDetails'
  | 'admin.orgsDeletedSuccess'
  | 'admin.orgsFailedDelete'

  // Feedback (vartotojo forma)
  | 'feedback.headerTitle'
  | 'feedback.headerSubtitle'
  | 'feedback.headerButton'
  | 'feedback.section.usage'
  | 'feedback.section.satisfaction'
  | 'feedback.section.reasons'
  | 'feedback.section.followUps'
  | 'feedback.section.usefulFeature'
  | 'feedback.section.bugs'
  | 'feedback.section.future'
  | 'feedback.field.sprintsUsed'
  | 'feedback.field.sprintsUsedHint'
  | 'feedback.field.overallRating'
  | 'feedback.field.wasSatisfied'
  | 'feedback.field.dissatisfactionReasons'
  | 'feedback.field.missedFunctionalities'
  | 'feedback.field.hardestToFind'
  | 'feedback.field.daysToGetUsedTo'
  | 'feedback.field.missedIntegrations'
  | 'feedback.field.acceptablePrice'
  | 'feedback.field.acceptablePriceHint'
  | 'feedback.field.otherReason'
  | 'feedback.field.unmentionedFlaw'
  | 'feedback.field.mostUsefulFeature'
  | 'feedback.field.encounteredBugs'
  | 'feedback.field.bugContext'
  | 'feedback.field.wouldTryAgain'
  | 'feedback.reason.MissingFunctionality'
  | 'feedback.reason.EasyToGetLost'
  | 'feedback.reason.DifficultToStart'
  | 'feedback.reason.MissingIntegration'
  | 'feedback.reason.NotVisuallyAppealing'
  | 'feedback.reason.NotUpToStandards'
  | 'feedback.reason.TooExpensive'
  | 'feedback.reason.Other'
  | 'feedback.reason.UnmentionedFlaw'
  | 'feedback.yes'
  | 'feedback.no'
  | 'feedback.submit'
  | 'feedback.submitting'
  | 'feedback.successToast'
  | 'feedback.errorToast'
  | 'feedback.validationError'

  // Feedback (admin)
  | 'feedback.admin.title'
  | 'feedback.admin.summary.total'
  | 'feedback.admin.summary.reviewed'
  | 'feedback.admin.summary.avgRating'
  | 'feedback.admin.summary.avgSprints'
  | 'feedback.admin.summary.satisfied'
  | 'feedback.admin.summary.wouldTryAgain'
  | 'feedback.admin.summary.bugs'
  | 'feedback.admin.charts.satisfaction'
  | 'feedback.admin.charts.reasons'
  | 'feedback.admin.charts.ratings'
  | 'feedback.admin.filter.all'
  | 'feedback.admin.filter.reviewed'
  | 'feedback.admin.filter.unreviewed'
  | 'feedback.admin.filter.satisfied'
  | 'feedback.admin.filter.unsatisfied'
  | 'feedback.admin.filter.withBugs'
  | 'feedback.admin.filter.withoutBugs'
  | 'feedback.admin.markReviewed'
  | 'feedback.admin.markUnreviewed'
  | 'feedback.admin.reviewedBy'
  | 'feedback.admin.empty'

  // Layout
  | 'layout.breadcrumbHome'
  | 'layout.breadcrumbOrganizations'
  | 'layout.breadcrumbProducts'
  | 'layout.breadcrumbTeams'
  | 'layout.breadcrumbBacklog'
  | 'layout.breadcrumbBoard'
  | 'layout.breadcrumbMetrics'
  | 'layout.breadcrumbAbsences'
  | 'layout.breadcrumbAdmin'

  // Shared
  | 'shared.tagAdd'
  | 'shared.tagRemove'
  | 'shared.workItem'
  | 'shared.errorTitle'
  | 'shared.errorMessage'
  | 'shared.errorRefresh'
  | 'shared.errorContact'
  | 'shared.confirmTitle'
  | 'shared.confirmMessage'

  // Retrospective
  | 'retro.title'
  | 'retro.button'
  | 'retro.readOnlyBanner'
  | 'retro.columnWentWell'
  | 'retro.columnDidntGoWell'
  | 'retro.columnActionItem'
  | 'retro.addCard'
  | 'retro.contentPlaceholder'
  | 'retro.contentRequired'
  | 'retro.empty'
  | 'retro.votes'
  | 'retro.vote'
  | 'retro.unvote'
  | 'retro.editCard'
  | 'retro.deleteCard'
  | 'retro.deleteConfirm'
  | 'retro.failedLoad'
  | 'retro.failedCreate'
  | 'retro.failedUpdate'
  | 'retro.failedDelete'
  | 'retro.failedVote'
  | 'retro.iterationNotStarted'

  // Quarter Plan
  | 'quarterPlan.title'
  | 'quarterPlan.subtitle'
  | 'quarterPlan.recentPageLabel'
  | 'quarterPlan.quarterShort'
  | 'quarterPlan.noIterationsTitle'
  | 'quarterPlan.noIterationsDescription'
  | 'quarterPlan.spanningFeatures'
  | 'quarterPlan.todo'
  | 'quarterPlan.inProgress'
  | 'quarterPlan.done'
  | 'quarterPlan.spSuffix'
  | 'quarterPlan.teamCapacity'
  | 'quarterPlan.daysSuffix'
  | 'quarterPlan.noFeatures'
  | 'quarterPlan.statusPlanning'
  | 'quarterPlan.statusActive'
  | 'quarterPlan.statusCompleted'

  // Kalbų pavadinimai
  | 'language.lt'
  | 'language.en';

export type Translations = Record<TranslationKey, string>;

export const translations: Record<Language, Translations> = {
  lt: {
    // Bendri
    'common.loading': 'Kraunama…',
    'common.cancel': 'Atšaukti',
    'common.save': 'Išsaugoti',
    'common.saving': 'Saugoma…',
    'common.delete': 'Ištrinti',
    'common.deleting': 'Trinama…',
    'common.edit': 'Redaguoti',
    'common.close': 'Uždaryti',
    'common.create': 'Sukurti',
    'common.creating': 'Kuriama…',
    'common.update': 'Atnaujinti',
    'common.updating': 'Atnaujinama…',
    'common.confirm': 'Patvirtinti',
    'common.back': 'Atgal',
    'common.next': 'Pirmyn',
    'common.search': 'Ieškoti',
    'common.yes': 'Taip',
    'common.no': 'Ne',
    'common.error': 'Klaida',
    'common.success': 'Pavyko',
    'common.required': 'Privalomas laukas',
    'common.optional': 'Neprivaloma',
    'common.add': 'Pridėti',
    'common.remove': 'Pašalinti',
    'common.actions': 'Veiksmai',
    'common.status': 'Būsena',
    'common.name': 'Pavadinimas',
    'common.description': 'Aprašymas',
    'common.date': 'Data',
    'common.from': 'Nuo',
    'common.to': 'Iki',
    'common.all': 'Visi',
    'common.none': 'Nėra',
    'common.unknown': 'Nežinoma',
    'common.retry': 'Bandyti dar kartą',
    'common.refresh': 'Atnaujinti',
    'common.tryAgain': 'Bandyti dar kartą',
    'common.openMenu': 'Atidaryti meniu',
    'common.unauthorized': 'Neturite prieigos teisių',
    'common.notFound': 'Nerasta',
    'common.justNow': 'ką tik',
    'common.minuteAgo': 'prieš 1 min.',
    'common.minutesAgo': 'prieš {n} min.',
    'common.hourAgo': 'prieš 1 val.',
    'common.hoursAgo': 'prieš {n} val.',
    'common.dayAgo': 'prieš 1 d.',
    'common.daysAgo': 'prieš {n} d.',

    // Header
    'header.themeToggle.toLight': 'Pakeisti į šviesųjį režimą',
    'header.themeToggle.toDark': 'Pakeisti į tamsųjį režimą',
    'header.themeToggle.srLabel': 'Pakeisti temą',
    'header.languageToggle.title': 'Pakeisti kalbą',
    'header.languageToggle.srLabel': 'Pakeisti kalbą',
    'header.adminPanel': 'Valdymo skydelis',
    'header.notifications': 'Pranešimai',
    'header.openMenu': 'Atidaryti meniu',
    'header.navigation': 'Navigacija',

    // Notifications (TODO: translate to Lithuanian)
    'notifications.dropdownTitle': 'Notifications',
    'notifications.markAllRead': 'Mark all as read',
    'notifications.empty': 'No notifications yet',
    'notifications.emptyDescription': "We'll let you know when something happens.",
    'notifications.loading': 'Loading...',
    'notifications.unreadBadge': '{count} unread',
    'notifications.workItemAssigned.title': 'Work item assigned',
    'notifications.workItemAssigned.message': 'You\'ve been assigned to work item: "{workItemTitle}".',
    'notifications.blockerResolved.title': 'Work item unblocked',
    'notifications.blockerResolved.message': 'Work item "{workItemTitle}" has been unblocked — the blocking work item "{blockerTitle}" was completed.',
    'notifications.addedToTeam.title': 'Added to team',
    'notifications.addedToTeam.message': 'You\'ve been added to the team "{teamName}".',
    'notifications.addedToOrganization.title': 'Invited to organization',
    'notifications.addedToOrganization.message': 'You\'ve been invited to the organization "{organizationName}".',
    'notifications.passwordReset.title': 'Password reset',
    'notifications.passwordReset.message': 'An administrator has initiated a password reset for your account. Check your email for the reset link.',
    'notifications.preferences.title': 'Notifications',
    'notifications.preferences.description': 'Choose which notifications you want to receive.',
    'notifications.preferences.master': 'Enable notifications',
    'notifications.preferences.masterDescription': "Master switch — when off, you won't receive any notifications.",
    'notifications.preferences.workItemAssigned': 'Work item assignments',
    'notifications.preferences.blockerResolved': 'Blocker resolved',
    'notifications.preferences.addedToTeam': 'Added to a team',
    'notifications.preferences.addedToOrganization': 'Added to an organization',
    'notifications.preferences.passwordResetNote': "Password reset notifications can't be turned off.",
    'notifications.preferences.savedToast': 'Notification preferences saved',
    'notifications.preferences.errorToast': 'Could not save preferences',

    // Markdown (TODO: translate to Lithuanian)
    'markdown.helperText': 'Supports Markdown formatting',
    'markdown.tabEdit': 'Edit',
    'markdown.tabPreview': 'Preview',
    'markdown.emptyPlaceholder': 'Click to add a description...',

    // Vartotojo meniu
    'user.profile': 'Profilis',
    'user.logout': 'Atsijungti',
    'user.fallbackName': 'Vartotojas',

    // Sidebar
    'sidebar.dashboard': 'Suvestinė',
    'sidebar.pinned': 'Prisegta',
    'sidebar.myOrganizations': 'Mano organizacijos',
    'sidebar.recentPages': 'Paskutiniai puslapiai',
    'sidebar.logout': 'Atsijungti',
    'sidebar.editProfile': 'Redaguoti profilį',

    // Auth
    'auth.welcomeBack': 'Sveiki sugrįžę',
    'auth.signInSubtitle': 'Prisijunkite, kad galėtumėte tęsti darbą',
    'auth.signIn': 'Prisijungti',
    'auth.signingIn': 'Jungiamasi…',
    'auth.emailAddress': 'El. paštas',
    'auth.emailPlaceholder': 'vardenis.pavardenis@paštas.lt',
    'auth.password': 'Slaptažodis',
    'auth.passwordPlaceholder': '••••••••',
    'auth.forgotPassword': 'Pamiršote slaptažodį?',
    'auth.passwordResetSuccess': 'Slaptažodis sėkmingai pakeistas. Pamėginkite prisijungti.',
    'auth.emailNotConfirmed': 'El. paštas nepatvirtintas',
    'auth.emailNotConfirmedMessage': 'Prieš prisijungdami turite patvirtinti savo el. pašto adresą. Patikrinkite įvestojo el.pašto dėžutę.',
    'auth.resendConfirmation': 'Pakartotinai atsiųsti patvirtinimo laišką',
    'auth.sending': 'Siunčiama…',
    'auth.confirmationLinkSent': 'Patvirtinimo nuoroda išsiųsta',
    'auth.failedToSend': 'Nepavyko išsiųsti. Pabandykite vėliau.',
    'auth.dontHaveAccount': 'Neturite paskyros?',
    'auth.createOne': 'Sukurti',
    'auth.showPassword': 'Rodyti slaptažodį',
    'auth.hidePassword': 'Slėpti slaptažodį',
    'auth.loginFailed': 'Nepavyko prisijungti.',
    'auth.createAccount': 'Sukurkite paskyrą',
    'auth.signUpSubtitle': 'Pradėkite naudotis Iterim',
    'auth.fullName': 'Vardas ir pavardė',
    'auth.fullNamePlaceholder': 'Vardenis Pavardenis',
    'auth.confirmPassword': 'Pakartokite slaptažodį',
    'auth.signUp': 'Registruotis',
    'auth.signingUp': 'Registruojama…',
    'auth.alreadyHaveAccount': 'Jau turite paskyrą?',
    'auth.signInLink': 'Prisijungti',
    'auth.passwordsDontMatch': 'Slaptažodžiai nesutampa',
    'auth.registrationFailed': 'Registracija nepavyko.',
    'auth.passwordRequirementsNotMet': 'Slaptažodis neatitinka reikalavimų',
    'auth.pwdReqLength': 'Bent 8 simboliai',
    'auth.pwdReqUpper': 'Didžioji raidė',
    'auth.pwdReqLower': 'Mažoji raidė',
    'auth.pwdReqNumber': 'Skaičius',
    'auth.forgotTitle': 'Pamiršote slaptažodį?',
    'auth.forgotSubtitle': 'Įveskite savo el. paštą — atsiųsime nuorodą atstatymui.',
    'auth.sendResetLink': 'Siųsti slaptažodžio atstatymo nuorodą',
    'auth.sendingResetLink': 'Siunčiama…',
    'auth.resetLinkSent': 'Atstatymo nuoroda buvo išsiųsta. Patikrinkite nurodytą pašto dėžutę',
    'auth.backToSignIn': 'Grįžti į prisijungimą',
    'auth.resetTitle': 'Nustatyti naują slaptažodį',
    'auth.resetSubtitle': 'Įveskite naują slaptažodį savo paskyrai.',
    'auth.newPassword': 'Naujas slaptažodis',
    'auth.changePassword': 'Pakeisti slaptažodį',
    'auth.changingPassword': 'Keičiama…',
    'auth.checkEmailTitle': 'Patikrinkite savo el. paštą',
    'auth.checkEmailSubtitle': 'Išsiuntėme jums patvirtinimo nuorodą. Spustelėkite ją, kad aktyvuotumėte paskyrą.',
    'auth.confirmingEmail': 'Tvirtinama…',
    'auth.emailConfirmed': 'El. paštas sėkmingai patvirtintas!',
    'auth.confirmFailed': 'Nepavyko patvirtinti el. pašto.',
    'auth.goToLogin': 'Grįžti prie prisijungimo',
    'auth.invalidResetLink': 'Netinkama atstatymo nuoroda',
    'auth.resetTokenMissing': 'Trūksta atstatymo žetono.',
    'auth.resetTokenInvalid': 'Atstatymo žetonas netinkamas arba jo galiojimas pasibaigė.',
    'auth.openInbox': 'Atidaryti gautuosius',
    'auth.didntReceive': 'Negavote laiško?',
    'auth.weWillRedirect': 'Netrukus būsite peradresuotas…',

    // Validation
    'validation.emailRequired': 'El. paštas yra privalomas',
    'validation.emailInvalid': 'Netaisyklingas el. pašto adresas',
    'validation.passwordRequired': 'Slaptažodis yra privalomas',
    'validation.passwordTooShort': 'Slaptažodis per trumpas',
    'validation.nameRequired': 'Vardas yra privalomas',
    'validation.confirmPasswordRequired': 'Pakartokite slaptažodį',
    'validation.fieldRequired': 'Šis laukas yra privalomas',
    'validation.tooShort': 'Reikšmė per trumpa',
    'validation.tooLong': 'Reikšmė per ilga',
    'validation.dateInvalid': 'Netinkama data',
    'validation.endBeforeStart': 'Pabaigos data turi būti vėlesnė už pradžios datą',

    // Dashboard
    'dashboard.title': 'Suvestinė',
    'dashboard.welcome': 'Sveiki,',
    'dashboard.myTeams': 'Mano komandos',
    'dashboard.noTeams': 'Kol kas nepriklausote jokiai komandai.',
    'dashboard.viewAll': 'Peržiūrėti visas',
    'dashboard.recentActivity': 'Naujausi veiksmai',
    'dashboard.upcomingAbsences': 'Artimiausios pravaikštos',
    'dashboard.assignedToMe': 'Priskirta man',
    'dashboard.noAssignedItems': 'Jums kol kas nepriskirta jokių darbų.',
    'dashboard.activeIterations': 'Aktyvios iteracijos',
    'dashboard.noActiveIterations': 'Šiuo metu aktyvių iteracijų nėra.',
    'dashboard.recentItems': 'Paskutinieji darbo elementai',
    'dashboard.noRecentItems': 'Naujausių darbo elementų nėra.',
    'dashboard.upcomingDeadlines': 'Artimiausi terminai',
    'dashboard.noUpcomingDeadlines': 'Artimiausių terminų nėra.',
    'dashboard.myOrganizations': 'Mano organizacijos',
    'dashboard.noOrganizations': 'Kol kas nepriklausote jokiai organizacijai.',
    'dashboard.createOrganization': 'Sukurti organizaciją',
    'dashboard.invitations': 'Pakvietimai',
    'dashboard.noInvitations': 'Naujų pakvietimų nėra.',
    'dashboard.greetingMorning': 'Labas rytas',
    'dashboard.greetingAfternoon': 'Laba diena',
    'dashboard.greetingEvening': 'Labas vakaras',
    'dashboard.sectionWork': 'Darbas',
    'dashboard.sectionWorkspace': 'Darbo erdvė',
    'dashboard.sectionQuickAccess': 'Greita prieiga',
    'dashboard.noPinnedTeams': 'Prisegtų komandų dar nėra. Prisekite komandą iš šoninės juostos.',
    'dashboard.noProducts': 'Produktų nėra',
    'dashboard.noTeamsInProduct': 'Komandų nėra',
    'dashboard.noRecentActivity': 'Naujausių veiksmų nėra.',
    'dashboard.activity.createdItem': 'sukūrė naują elementą',
    'dashboard.activity.updatedItem': 'atnaujino elementą',
    'dashboard.activity.commented': 'paliko komentarą',
    'dashboard.blockedWork': 'Blokuojami darbai',
    'dashboard.noBlockedWork': 'Šiuo metu jūsų darbai nėra blokuojami.',
    'dashboard.blockedBy': 'Blokuoja',
    'dashboard.blockerDone': 'Užbaigta',
    'dashboard.blockerNotDone': 'Neužbaigta',
    'dashboard.unfinishedBlockers': 'neužbaigti blokeriai',

    // Organizations
    'organizations.title': 'Organizacijos',
    'organizations.create': 'Sukurti organizaciją',
    'organizations.created': 'Organizacija sukurta',
    'organizations.deleted': 'Organizacija ištrinta',
    'organizations.createTitle': 'Sukurti naują organizaciją',
    'organizations.createDescription': 'Sukurkite organizaciją, kad galėtumėte valdyti komandas ir produktus.',
    'organizations.namePlaceholder': 'Pvz., Iterim Ltd.',
    'organizations.descriptionPlaceholder': 'Trumpas organizacijos aprašymas',
    'organizations.members': 'Nariai',
    'organizations.member': 'Narys',
    'organizations.addMember': 'Pridėti narį',
    'organizations.addMemberTitle': 'Pridėti narį',
    'organizations.addMemberDescription': 'Įveskite el. paštą, kad pakviestumėte narį prisijungti prie organizacijos.',
    'organizations.removeMember': 'Pašalinti narį',
    'organizations.invitations': 'Pakvietimai',
    'organizations.pendingInvitations': 'Pakvietimai',
    'organizations.noPendingInvitations': 'Pakvietimų nėra.',
    'organizations.acceptInvitation': 'Priimti',
    'organizations.declineInvitation': 'Atmesti',
    'organizations.role': 'Rolė',
    'organizations.roleOwner': 'Savininkas',
    'organizations.roleAdmin': 'Administratorius',
    'organizations.roleMember': 'Narys',
    'organizations.invite': 'Pakviesti',
    'organizations.inviteSent': 'Kvietimas išsiųstas',
    'organizations.invited': 'Pakviesta',
    'organizations.leave': 'Palikti organizaciją',
    'organizations.leaveConfirm': 'Ar tikrai norite palikti šią organizaciją?',
    'organizations.deleteConfirm': 'Ar tikrai norite ištrinti šią organizaciją?',
    'organizations.deleteWarning': 'Šis veiksmas yra negrįžtamas. Visi susiję duomenys bus ištrinti.',
    'organizations.noOrganizations': 'Organizacijų nėra.',
    'organizations.createFirst': 'Sukurkite pirmąją organizaciją',
    'organizations.products': 'Produktai',
    'organizations.teams': 'Komandos',
    'organizations.settings': 'Nustatymai',
    'organizations.overview': 'Apžvalga',
    'organizations.failedLoad': 'Nepavyko įkelti organizacijų.',
    'organizations.failedCreate': 'Nepavyko sukurti organizacijos.',
    'organizations.failedDelete': 'Nepavyko ištrinti organizacijos.',
    'organizations.failedInvite': 'Nepavyko išsiųsti pakvietimo.',
    'organizations.memberRemoved': 'Narys sėkmingai pašalintas',
    'organizations.memberInvited': 'Narys sėkmingai pakviestas',
    'organizations.roleUpdated': 'Nario rolė sėkmingai atnaujinta',
    'organizations.failedRoleUpdate': 'Nepavyko atnaujinti nario rolės.',
    'organizations.changeRoleConfirm': 'Ar tikrai norite pakeisti šio nario rolę?',
    'organizations.cannotChangeOwnRole': 'Savo paties rolės keisti negalite',
    'organizations.cannotChangeOwnerRole': 'Savininko rolės pakeisti negalima',
    'organizations.cannotChangeOtherAdminRole': 'Šio administratoriaus rolės sumažinti gali tik savininkas arba tas, kuris šią rolę jam suteikė',
    'organizations.email': 'El. paštas',
    'organizations.absence': 'Pravaikšta',
    'organizations.activeMembers': 'Aktyvūs nariai',
    'organizations.manageAbsences': 'Tvarkyti pravaikštas',
    'organizations.registerAbsence': 'Registruoti',
    'organizations.noAccess': 'Nėra prieigos',
    'organizations.tags': 'Žymės',
    'organizations.addTag': 'Pridėti žymę',
    'organizations.tagNamePlaceholder': 'Žymės pavadinimas (pvz., frontend)',
    'organizations.noTags': 'Žymių dar nėra. Sukurkite žymes, kad galėtumėte jas naudoti darbo elementuose ir priskirti komandų nariams.',
    'organizations.tagCreated': 'Žymė sukurta',
    'organizations.tagDeleted': 'Žymė ištrinta',
    'organizations.failedCreateTag': 'Nepavyko sukurti žymės',
    'organizations.failedDeleteTag': 'Nepavyko ištrinti žymės',
    'organizations.roleViewer': 'Stebėtojas',
    'organizations.slug': 'Trumpinys',

    // Products
    'products.title': 'Produktai',
    'products.create': 'Sukurti produktą',
    'products.created': 'Produktas sukurtas',
    'products.updated': 'Produktas atnaujintas',
    'products.deleted': 'Produktas ištrintas',
    'products.createTitle': 'Sukurti naują produktą',
    'products.editTitle': 'Redaguoti produktą',
    'products.namePlaceholder': 'Produkto pavadinimas',
    'products.descriptionPlaceholder': 'Produkto aprašymas',
    'products.owner': 'Produkto savininkas',
    'products.organization': 'Organizacija',
    'products.status': 'Būsena',
    'products.statusActive': 'Aktyvus',
    'products.statusArchived': 'Archyvuotas',
    'products.statusDraft': 'Juodraštis',
    'products.deleteConfirm': 'Ar tikrai norite pašalinti šį produktą?',
    'products.noProducts': 'Produktų nėra.',
    'products.createFirst': 'Sukurkite pirmąjį produktą',
    'products.failedLoad': 'Nepavyko įkelti produktų.',
    'products.failedCreate': 'Nepavyko sukurti produkto.',
    'products.failedUpdate': 'Nepavyko atnaujinti produkto.',
    'products.failedDelete': 'Nepavyko ištrinti produkto.',
    'products.backlog': 'Darbų sąrašas',
    'products.board': 'Lenta',
    'products.metrics': 'Metrikos',
    'products.team': 'Komanda',
    'products.iterations': 'Iteracijos',
    'products.overview': 'Apžvalga',
    'products.details': 'Produkto informacija',
    'products.productId': 'Produkto ID',
    'products.createdBy': 'Sukūrė',
    'products.updatedBy': 'Atnaujino',

    // Teams
    'teams.title': 'Komandos',
    'teams.create': 'Sukurti komandą',
    'teams.createTitle': 'Sukurti naują komandą',
    'teams.updated': 'Komanda atnaujinta',
    'teams.memberAdded': 'Narys pridėtas',
    'teams.memberRemoved': 'Narys pašalintas',
    'teams.editTitle': 'Redaguoti komandą',
    'teams.namePlaceholder': 'Komandos pavadinimas',
    'teams.descriptionPlaceholder': 'Komandos aprašymas',
    'teams.members': 'Nariai',
    'teams.lead': 'Komandos vadovas',
    'teams.capacity': 'Pajėgumas',
    'teams.capacityHours': 'Valandų iteracijoje',
    'teams.addMember': 'Pridėti narį',
    'teams.addMemberTitle': 'Pridėti narį prie komandos',
    'teams.removeMember': 'Pašalinti narį',
    'teams.removeMemberConfirm': 'Ar tikrai norite pašalinti šį narį iš komandos?',
    'teams.deleteConfirm': 'Ar tikrai norite pašalinti šią komandą?',
    'teams.noTeams': 'Komandų nėra.',
    'teams.createFirst': 'Sukurkite pirmąją komandą',
    'teams.failedLoad': 'Nepavyko įkelti komandų.',
    'teams.failedCreate': 'Nepavyko sukurti komandos.',
    'teams.failedUpdate': 'Nepavyko atnaujinti komandos.',
    'teams.failedDelete': 'Nepavyko ištrinti komandos.',
    'teams.role': 'Rolė',
    'teams.roleLead': 'Vadovas',
    'teams.roleMember': 'Narys',
    'teams.roleAdmin': 'Administratorius',
    'teams.roleViewer': 'Stebėtojas',
    'teams.cannotChangeOwnRole': 'Savo paties rolės keisti negalite',
    'teams.cannotChangeCreatorRole': 'Komandos kūrėjo rolės pakeisti negalima',
    'teams.cannotChangeOtherAdminRole': 'Šio administratoriaus rolės sumažinti gali tik komandos / produkto kūrėjas arba tas, kuris šią rolę jam suteikė',
    'teams.roleCreator': 'Kūrėjas',
    'teams.information': 'Komandos informacija',
    'teams.teamId': 'Komandos ID',
    'teams.created': 'Sukurta',
    'teams.lastUpdated': 'Paskutinį kartą atnaujinta',
    'teams.createdBy': 'pateikė',
    'teams.noMembers': 'Šioje komandoje narių dar nėra.',

    // Backlog
    'backlog.selected': 'pasirinkta',
    'backlog.moveTo': 'Perkelti į...',
    'backlog.movingItems': 'Perkeliama elementų:',
    'backlog.title': 'Darbų sąrašas',
    'backlog.addItem': 'Pridėti darbo elementą',
    'backlog.createItemTitle': 'Sukurti darbo elementą',
    'backlog.editItemTitle': 'Redaguoti darbo elementą',
    'backlog.itemTitle': 'Pavadinimas',
    'backlog.itemTitlePlaceholder': 'Trumpas darbo elemento pavadinimas',
    'backlog.itemDescription': 'Aprašymas',
    'backlog.itemDescriptionPlaceholder': 'Detalus aprašymas',
    'backlog.type': 'Tipas',
    'backlog.typeStory': 'Istorija',
    'backlog.typeBug': 'Klaida',
    'backlog.typeTask': 'Užduotis',
    'backlog.typeEpic': 'Epas',
    'backlog.priority': 'Prioritetas',
    'backlog.priorityLow': 'Žemas',
    'backlog.priorityMedium': 'Vidutinis',
    'backlog.priorityHigh': 'Aukštas',
    'backlog.priorityCritical': 'Aukščiausias',
    'backlog.status': 'Būsena',
    'backlog.statusNew': 'Naujas',
    'backlog.statusInProgress': 'Vykdoma',
    'backlog.statusReview': 'Peržiūrima',
    'backlog.statusDone': 'Užbaigta',
    'backlog.blockedStatusHint': 'Šis darbas turi neužbaigtų blokuojančių darbų — jo negalima perkelti į „Vykdoma“, „Peržiūrima“ ar „Užbaigta“, kol jie neišspręsti.',
    'backlog.statusBlocked': 'Užblokuota',
    'backlog.points': 'Taškai',
    'backlog.assignee': 'Atsakingas',
    'backlog.unassigned': 'Nepriskirta',
    'backlog.tags': 'Žymos',
    'backlog.addTag': 'Pridėti žymą',
    'backlog.filters': 'Filtrai',
    'backlog.sortBy': 'Rūšiuoti pagal',
    'backlog.noItems': 'Darbų sąraše nėra elementų.',
    'backlog.searchPlaceholder': 'Ieškoti darbo elementų…',
    'backlog.iteration': 'Iteracija',
    'backlog.createIteration': 'Sukurti iteraciją',
    'backlog.editIteration': 'Redaguoti iteraciją',
    'backlog.completeIteration': 'Užbaigti iteraciją',
    'backlog.iterationName': 'Iteracijos pavadinimas',
    'backlog.iterationStartDate': 'Pradžios data',
    'backlog.iterationEndDate': 'Pabaigos data',
    'backlog.iterationGoal': 'Iteracijos tikslas',
    'backlog.dependencies': 'Priklausomybės',
    'backlog.addDependency': 'Pridėti priklausomybę',
    'backlog.dependencyType': 'Priklausomybės tipas',
    'backlog.blocks': 'Blokuoja',
    'backlog.blockedBy': 'Blokuojama',
    'backlog.relatesTo': 'Susijęs su',
    'backlog.duplicates': 'Dublikatas',
    'backlog.deleteItemConfirm': 'Ar tikrai norite ištrinti šį darbo elementą?',
    'backlog.failedLoad': 'Nepavyko įkelti darbų sąrašo.',
    'backlog.failedCreate': 'Nepavyko sukurti darbo elemento.',
    'backlog.failedUpdate': 'Nepavyko atnaujinti darbo elemento.',
    'backlog.failedDelete': 'Nepavyko ištrinti darbo elemento.',
    'backlog.completeConfirm': 'Ar tikrai norite užbaigti šią iteraciją?',
    'backlog.moveUnfinishedTo': 'Perkelti nebaigtus elementus į',
    'backlog.dependencyDetails': 'Informacija apie priklausomybes',
    'backlog.removeDependency': 'Pašalinti priklausomybę',
    'backlog.transferItem': 'Perkelti į kitą komandą',
    'backlog.transferItemConfirm': 'Patvirtinti perkėlimą',
    'backlog.transferItemTitle': 'Perkelti į kitą komandą',
    'backlog.transferItemDescription': 'Darbo elementas bus pašalintas iš dabartinės iteracijos ir vykdytojas bus pašalintas. Priklausomybės bus išsaugotos.',
    'backlog.transferItemTargetLabel': 'Pasirinkite tikslinę komandą',
    'backlog.transferItemTargetPlaceholder': 'Pasirinkite komandą',
    'backlog.transferItemSelectedLabel': 'Į komandą',
    'backlog.transferItemLoading': 'Kraunamas komandų sąrašas...',
    'backlog.transferItemNoTeams': 'Šioje organizacijoje nėra kitų komandų.',
    'backlog.transferItemNoProductTeams': 'Šiame produkte nėra kitų komandų.',
    'backlog.transferItemSubmitting': 'Perkeliama...',
    'backlog.transferItemSuccess': 'Darbo elementas sėkmingai perkeltas.',
    'backlog.transferItemUnauthorized': 'Neturite teisių perkelti šią užduotį',
    'backlog.transferItemFailedLoad': 'Nepavyko įkelti komandų sąrašo.',
    'backlog.transferItemFailed': 'Nepavyko perkelti darbo elemento.',
    'backlog.editItemDescription': 'Atnaujinkite darbo elemento laukus ir išsaugokite pakeitimus.',
    'backlog.allTypes': 'Visi tipai',
    'backlog.allStatuses': 'Visos būsenos',
    'backlog.allAssignees': 'Visi vykdytojai',
    'backlog.allTags': 'Visos žymės',
    'backlog.statusBacklog': 'Darbų rezervas',
    'backlog.statusTodo': 'Reikia atlikti',
    'backlog.dragHelp': 'Tempkite elementus tarp sekcijų, kad suplanuotumėte iteracijas',
    'backlog.dragHere': 'Tempkite elementus čia, kad suplanuotumėte šią iteraciją',
    'backlog.showCompleted': 'Rodyti užbaigtas',
    'backlog.completedCount': 'užbaigtos',
    'backlog.comments': 'Komentarai',
    'backlog.commentsLoading': 'Kraunami komentarai…',
    'backlog.commentsEmpty': 'Dar nėra komentarų',
    'backlog.commentsEdited': '(redaguota)',
    'backlog.commentsPlaceholder': 'Parašykite komentarą… (Ctrl+Enter)',
    'backlog.commentsPosting': 'Skelbiama…',
    'backlog.commentsPost': 'Komentuoti',
    'backlog.commentsDeleteTitle': 'Ištrinti komentarą?',
    'backlog.commentsDeleteDesc': 'Šio veiksmo negalima bus atšaukti.',
    'backlog.commentsFailedAdd': 'Nepavyko pridėti komentaro',
    'backlog.commentsFailedUpdate': 'Nepavyko atnaujinti komentaro',
    'backlog.commentsFailedDelete': 'Nepavyko ištrinti komentaro',
    'backlog.iterationStatusPlanning': 'Planuojama',
    'backlog.iterationStatusActive': 'Aktyvi',
    'backlog.iterationStatusCompleted': 'Užbaigta',
    'backlog.startIteration': 'Pradėti',
    'backlog.addItemsFirst': 'Prieš pradedant pridėkite elementų',
    'backlog.doneCount': 'atlikta',

    // ATPA
    'atpa.suggestButton': 'Siūlyti priskyrimus',
    'atpa.title': 'Priskyrimų siūlymai',
    'atpa.subtitle': 'Automatinio užduočių priskyrimo algoritmas pasiūlė šiuos priskyrimus pagal žymes ir nario pajėgumą.',
    'atpa.loading': 'Skaičiuojami siūlymai…',
    'atpa.empty': 'Nėra naujų siūlymų.',
    'atpa.allAssigned': 'Visi šios iteracijos elementai jau priskirti nariams.',
    'atpa.applyAll': 'Priimti visus',
    'atpa.applyingAll': 'Priimama…',
    'atpa.apply': 'Priimti',
    'atpa.applying': 'Priimama…',
    'atpa.reject': 'Atmesti',
    'atpa.confidence': 'Patikimumas',
    'atpa.matchingTags': 'Sutampančios žymės',
    'atpa.reason': 'Pagrindimas',
    'atpa.warnings': 'Įspėjimai',
    'atpa.warningOverloaded': 'Per didelis krūvis',
    'atpa.warningOversized': 'Per didelis darbo elementas',
    'atpa.warningUnmatched': 'Nesutampa žymės',
    'atpa.warningNoCapacity': 'Nėra laisvo pajėgumo',
    'atpa.unassigned': 'Nepriskirti',
    'atpa.unassignedHint': 'Šiems elementams algoritmas nerado tinkamo nario.',
    'atpa.capacity': 'Komandos pajėgumas',
    'atpa.capacityBefore': 'Prieš',
    'atpa.capacityAfter': 'Po pritaikymo',
    'atpa.scheduleFullTime': 'Pilnas etatas',
    'atpa.schedulePartTime': 'Dalinis etatas',
    'atpa.scheduleCustom': 'Individualus',
    'atpa.suggestedFor': 'Siūlomas',
    'atpa.failedLoad': 'Nepavyko gauti pasiūlymų.',
    'atpa.appliedToast': 'Pritaikyti siūlymai',
    'atpa.partialAppliedToast': 'Dalis siūlymų nepavyko pritaikyti.',
    'atpa.failedApply': 'Nepavyko pritaikyti siūlymo.',
    'atpa.noActiveIteration': 'Pasirinkite planuojamą arba aktyvią iteraciją.',

    // ATPA – warning code translations ({title}, {sp}, {name} – placeholderiai iš messageParams)
    'atpa.code.NO_TEAM_MEMBERS': 'Komanda neturi narių, todėl priskyrimų pasiūlyti negalima.',
    'atpa.code.NO_TAG_MATCH': '„{title}" turi žymes, kurių nė vienas narys neturi (nei eksplicitiškai, nei pagal istoriją) — priskirta pagal capacity.',
    'atpa.code.SP_EXCEEDS_CAPACITY': '„{title}" SP ({sp}) yra didesnis nei bet kurio nario capacity — apsvarstykite suskaidymą.',
    'atpa.code.ALL_MEMBERS_OVERLOADED': 'Nepavyko priskirti „{title}" — visi nariai jau perpildyti.',
    'atpa.code.MEMBER_OVERLOADED': '{name} pasiekė capacity ribą — naujų work items priskirti nebegalima.',

    // ATPA – reason code translations (žymių dalis + capacity dalis)
    'atpa.reason.NO_TAGS_CAPACITY_BASED': 'nėra žymių, sprendimas pagal capacity',
    'atpa.reason.TAG_FULL_MATCH': 'visiškai sutampa žymės',
    'atpa.reason.TAG_PARTIAL_MATCH': 'dalinis žymių sutapimas',
    'atpa.reason.TAG_INFERRED_FULL': 'atitikimas pagal nario darbų istoriją',
    'atpa.reason.TAG_INFERRED_PARTIAL': 'dalinis atitikimas pagal nario darbų istoriją',
    'atpa.reason.TAG_MIXED_MATCH': 'sutapimas pagal žymes ir istoriją ({explicitMatchCount} expl. + {inferredMatchCount} infer.)',
    'atpa.reason.TAG_NO_MATCH': 'žymių sutapimo nėra',
    'atpa.reason.CAPACITY_HIGH': 'daugiausia laisvos capacity',
    'atpa.reason.CAPACITY_MEDIUM': 'pakankama laisva capacity',
    'atpa.reason.CAPACITY_LOW': 'ribota laisva capacity',

    // ATPA – unassigned reason codes
    'atpa.unassignedReason.OVERSIZED': '„{title}" SP ({sp}) viršija bet kurio nario didžiausią capacity.',
    'atpa.unassignedReason.ALL_FULL': 'Visi nariai pilni arba SP ({sp}) viršija bet kurio nario likusią capacity.',
    'atpa.unassignedReason.ALL_FULL_NO_SP': 'Visi nariai pilni — laisvos capacity nepakanka.',

    // Board
    'board.title': 'Lenta',
    'board.todo': 'Reikia atlikti',
    'board.inProgress': 'Vykdoma',
    'board.review': 'Peržiūrima',
    'board.done': 'Atlikta',
    'board.blocked': 'Užblokuota',
    'board.noItemsInColumn': 'Šiame stulpelyje elementų nėra.',
    'board.noActiveIteration': 'Aktyvių iteracijų nėra.',
    'board.selectIteration': 'Pasirinkite iteraciją',
    'board.dragHint': 'Tempkite korteles tarp stulpelių.',
    'board.blockerError': 'Negalima perkelti užblokuoto elemento',
    'board.blockerErrorMessage': 'Šis darbo elementas turi neatliktų blokuojančių priklausomybių.',
    'board.cannotMoveBlocked': 'Negalima perkelti užblokuoto elemento.',
    'board.failedLoad': 'Nepavyko įkelti lentos.',
    'board.failedMove': 'Nepavyko perkelti elemento.',
    'board.noTags': 'Žymų nėra',

    // Metrics
    'metrics.title': 'Metrikos',
    'metrics.velocity': 'Greitis',
    'metrics.velocityDescription': 'Vidutinis komandos greitis iteracijoje.',
    'metrics.burndown': 'Užbaigtumo grafikas',
    'metrics.burndownDescription': 'Likę darbai iteracijoje.',
    'metrics.burnup': 'Atliktumo grafikas',
    'metrics.capacity': 'Pajėgumai',
    'metrics.capacityDescription': 'Komandos pajėgumai šiai iteracijai.',
    'metrics.sprintProgress': 'Iteracijos eiga',
    'metrics.sprintProgressDescription': 'Dabartinės iteracijos pažanga.',
    'metrics.throughput': 'Pralaidumas',
    'metrics.cycleTime': 'Ciklo laikas',
    'metrics.leadTime': 'Įgyvendinimo laikas',
    'metrics.completed': 'Užbaigta',
    'metrics.remaining': 'Liko',
    'metrics.committed': 'Įsipareigota',
    'metrics.inProgress': 'Vykdoma',
    'metrics.dateRange': 'Datų intervalas',
    'metrics.lastNSprints': 'Paskutinės iteracijos',
    'metrics.points': 'Balai',
    'metrics.day': 'Diena',
    'metrics.ideal': 'Idealu',
    'metrics.actual': 'Realu',
    'metrics.noData': 'Duomenų nėra.',
    'metrics.failedLoad': 'Nepavyko įkelti metrikų.',

    // Absences
    'absences.title': 'Pravaikštos',
    'absences.create': 'Pridėti pravaikštą',
    'absences.createTitle': 'Nauja pravaikšta',
    'absences.editTitle': 'Redaguoti pravaikštą',
    'absences.type': 'Tipas',
    'absences.typeVacation': 'Atostogos',
    'absences.typeSick': 'Liga',
    'absences.typePersonal': 'Asmeninė priežastis',
    'absences.typeOther': 'Kita',
    'absences.startDate': 'Pradžios data',
    'absences.endDate': 'Pabaigos data',
    'absences.startTime': 'Pradžios laikas',
    'absences.endTime': 'Pabaigos laikas',
    'absences.timeRange': 'Laikas',
    'absences.reason': 'Priežastis',
    'absences.reasonPlaceholder': 'Trumpas paaiškinimas',
    'absences.status': 'Būsena',
    'absences.statusPending': 'Laukiama patvirtinimo',
    'absences.statusApproved': 'Patvirtinta',
    'absences.statusRejected': 'Atmesta',
    'absences.approve': 'Patvirtinti',
    'absences.reject': 'Atmesti',
    'absences.deleteConfirm': 'Ar tikrai norite ištrinti šią pravaikštą?',
    'absences.noAbsences': 'Pravaikštų nėra.',
    'absences.failedLoad': 'Nepavyko įkelti pravaikštų.',
    'absences.failedCreate': 'Nepavyko sukurti pravaikštos.',
    'absences.failedUpdate': 'Nepavyko atnaujinti pravaikštos.',
    'absences.failedDelete': 'Nepavyko pašalinti pravaikštos.',
    'absences.registerAbsence': 'Registruoti pravaikštą',
    'absences.searchMember': 'Ieškoti nario pagal vardą...',
    'absences.clear': 'Išvalyti',
    'absences.allTypes': 'Visi tipai',
    'absences.typeFilterPlaceholder': 'Tipas',
    'absences.typeAbsent': 'Neatvykimas',
    'absences.typeLate': 'Vėlavimas',
    'absences.subtitle': 'Artimiausios pravaikštos',
    'absences.noResults': 'Pagal pasirinktus filtrus rezultatų nerasta.',
    'absences.noActiveMembership': 'Aktyvios narystės nėra',

    // Profile
    'profile.title': 'Profilis',
    'profile.personalInfo': 'Asmeninė informacija',
    'profile.preferences': 'Nustatymai',
    'profile.security': 'Saugumas',
    'profile.fullName': 'Vardas ir pavardė',
    'profile.email': 'El. paštas',
    'profile.role': 'Rolė',
    'profile.avatar': 'Profilio nuotrauka',
    'profile.changeAvatar': 'Pakeisti nuotrauką',
    'profile.removeAvatar': 'Pašalinti nuotrauką',
    'profile.language': 'Kalba',
    'profile.theme': 'Tema',
    'profile.notifications': 'Pranešimai',
    'profile.changePassword': 'Pakeisti slaptažodį',
    'profile.currentPassword': 'Dabartinis slaptažodis',
    'profile.newPassword': 'Naujas slaptažodis',
    'profile.confirmNewPassword': 'Pakartokite naują slaptažodį',
    'profile.saved': 'Pakeitimai sėkmingai išsaugoti',
    'profile.failedSave': 'Nepavyko išsaugoti pakeitimų.',
    'profile.deleteAccount': 'Ištrinti paskyrą',
    'profile.deleteAccountConfirm': 'Ar tikrai norite ištrinti savo paskyrą? Šio veiksmo negalima anuliuoti.',

    // Admin
    'admin.usersTitle': 'Vartotojų valdymas',
    'admin.systemTitle': 'Sistemos informacija',
    'admin.sidebarUsers': 'Vartotojai',
    'admin.sidebarSystem': 'Sistema',
    'admin.sidebarFeedback': 'Atsiliepimai',
    'admin.allUsers': 'Visi vartotojai',
    'admin.addUser': 'Pridėti vartotoją',
    'admin.editUser': 'Redaguoti vartotoją',
    'admin.deleteUser': 'Ištrinti vartotoją',
    'admin.deleteUserConfirm': 'Ar tikrai norite pašalinti šį vartotoją?',
    'admin.suspend': 'Sustabdyti',
    'admin.activate': 'Aktyvuoti',
    'admin.role': 'Rolė',
    'admin.roleAdmin': 'Administratorius',
    'admin.roleUser': 'Vartotojas',
    'admin.status': 'Būsena',
    'admin.statusActive': 'Aktyvus',
    'admin.statusSuspended': 'Sustabdytas',
    'admin.lastLogin': 'Paskutinis prisijungimas',
    'admin.never': 'Niekada',
    'admin.systemHealth': 'Sistemos būklė',
    'admin.systemVersion': 'Versija',
    'admin.systemUptime': 'Veikimo laikas',
    'admin.totalUsers': 'Iš viso vartotojų',
    'admin.activeUsers': 'Aktyvūs vartotojai',
    'admin.totalOrganizations': 'Iš viso organizacijų',
    'admin.totalProducts': 'Iš viso produktų',
    'admin.failedLoad': 'Nepavyko įkelti duomenų.',
    'admin.search': 'Ieškoti vartotojų…',
    'admin.sidebarOrganizations': 'Organizacijos',
    'admin.totalTeams': 'Iš viso komandų',
    'admin.totalWorkItems': 'Iš viso darbo elementų',
    'admin.totalIterations': 'Iš viso iteracijų',
    'admin.usersTotal': 'Iš viso',
    'admin.usersNewThisWeek': 'Nauja šią savaitę',
    'admin.usersNewThisMonth': 'Nauja šį mėnesį',
    'admin.usersBlocked': 'Užblokuota',
    'admin.usersUnconfirmed': 'Nepatvirtintas el. paštas',
    'admin.workItemsByStatus': 'Darbo elementai pagal būseną',
    'admin.lastRefresh': 'Paskutinis atnaujinimas:',
    'admin.rawJson': 'Neapdoroti JSON duomenys',
    'admin.healthHealthy': 'Sveika',
    'admin.healthDegraded': 'Prasta',
    'admin.healthUnhealthy': 'Neveikia',
    'admin.healthConnected': 'Prisijungta ir reaguoja',
    'admin.healthConnectionFailed': 'Prisijungimas nepavyko',
    'admin.healthResponseTime': 'Atsako laikas:',
    'admin.healthHighUsage': 'Didelė apkrova — rekomenduojama paleisti iš naujo',
    'admin.healthNormalUsage': 'Normali apkrova',
    'admin.healthOverall': 'Bendra būklė:',
    'admin.orgsTitle': 'Sistemos administravimas',
    'admin.orgsDescription': 'Valdyti visas platformos organizacijas.',
    'admin.orgsSearchPlaceholder': 'Ieškoti organizacijų…',
    'admin.orgsColMembers': 'Nariai',
    'admin.orgsColProducts': 'Produktai',
    'admin.orgsColTeams': 'Komandos',
    'admin.orgsColCreated': 'Sukurta',
    'admin.orgsColLastActivity': 'Paskutinė veikla',
    'admin.orgsNotFound': 'Nerasta jokių organizacijų pagal paieškos užklausą.',
    'admin.orgsUnknown': 'Nežinoma',
    'admin.orgsNever': 'Niekada',
    'admin.orgsViewDetails': 'Peržiūrėti detales',
    'admin.orgsDeleteOrg': 'Ištrinti organizaciją',
    'admin.orgsDetailTitle': 'Organizacijos detalės',
    'admin.orgsDetailCreated': 'Sukurta:',
    'admin.orgsDetailSlug': 'Slug:',
    'admin.orgsDetailMembers': 'Nariai',
    'admin.orgsDetailProducts': 'Produktai ir komandos',
    'admin.orgsNoProducts': 'Nerasta jokių produktų.',
    'admin.orgsNoTeams': 'Nėra komandų',
    'admin.orgsDeleteTitle': 'Ištrinti organizaciją',
    'admin.orgsDeleteConfirm': 'Ar tikrai? Tai visam laikui pašalins organizaciją su visais jos produktais, komandomis, darbo elementais ir nariais. Šio veiksmo negalima atšaukti.',
    'admin.orgsDeleting': 'Trinama…',
    'admin.orgsDeletePermanently': 'Ištrinti visam laikui',
    'admin.orgsFailedLoad': 'Nepavyko įkelti organizacijų.',
    'admin.orgsFailedDetails': 'Nepavyko įkelti organizacijos detalių.',
    'admin.orgsDeletedSuccess': 'Organizacija sėkmingai ištrinta.',
    'admin.orgsFailedDelete': 'Nepavyko ištrinti organizacijos.',

    // Feedback (vartotojo forma) — AI vertimas, prašome peržiūrėti
    'feedback.headerTitle': 'Atsiliepimo forma',
    'feedback.headerSubtitle': 'Pasidalinkite savo patirtimi naudojant Iterim. Jūsų atsiliepimas padės mums tobulinti sistemą.',
    'feedback.headerButton': 'Atsiliepimas',
    'feedback.section.usage': 'Naudojimas',
    'feedback.section.satisfaction': 'Pasitenkinimas',
    'feedback.section.reasons': 'Pasirinkite priežastis',
    'feedback.section.followUps': 'Papildomi klausimai',
    'feedback.section.usefulFeature': 'Naudingiausia funkcija',
    'feedback.section.bugs': 'Klaidos',
    'feedback.section.future': 'Ateitis',
    'feedback.field.sprintsUsed': 'Kiek sprintų naudojotės Iterim?',
    'feedback.field.sprintsUsedHint': 'Įveskite skaičių (pvz. 2)',
    'feedback.field.overallRating': 'Bendras įvertinimas',
    'feedback.field.wasSatisfied': 'Ar likote patenkinti sistema?',
    'feedback.field.dissatisfactionReasons': 'Kodėl nelikote patenkinti? (galima rinktis kelias)',
    'feedback.field.missedFunctionalities': 'Kokių funkcionalumų pasigedote?',
    'feedback.field.hardestToFind': 'Kurias funkcijas buvo sunkiausia surasti?',
    'feedback.field.daysToGetUsedTo': 'Kiek darbo dienų užtruko priprasti?',
    'feedback.field.missedIntegrations': 'Kokios programos integracijos pasigedote?',
    'feedback.field.acceptablePrice': 'Kiek būtų jums priimtina sistemos kaina?',
    'feedback.field.acceptablePriceHint': 'EUR per mėnesį už vartotoją',
    'feedback.field.otherReason': 'Aprašykite plačiau',
    'feedback.field.unmentionedFlaw': 'Įveskite trūkumą, kuris nebuvo paminėtas',
    'feedback.field.mostUsefulFeature': 'Kuri funkcija jums buvo naudingiausia? (neprivaloma)',
    'feedback.field.encounteredBugs': 'Ar susidūrėte su klaidomis (bug\'ais)?',
    'feedback.field.bugContext': 'Ką darėte, kai sistema nustojo veikti taip, kaip turėtų?',
    'feedback.field.wouldTryAgain': 'Ar pamėgintumėte naudotis šia sistema po keleto atnaujinimų?',
    'feedback.reason.MissingFunctionality': 'Trūko funkcionalumų',
    'feedback.reason.EasyToGetLost': 'Buvo lengva pasimesti',
    'feedback.reason.DifficultToStart': 'Buvo sunku pradėti naudotis',
    'feedback.reason.MissingIntegration': 'Trūko kritinės programos integracijos',
    'feedback.reason.NotVisuallyAppealing': 'Nebuvo patraukli akiai',
    'feedback.reason.NotUpToStandards': 'Neatitiko įmonės standartų',
    'feedback.reason.TooExpensive': 'Per brangu',
    'feedback.reason.Other': 'Kita',
    'feedback.reason.UnmentionedFlaw': 'Nepaminėtas trūkumas',
    'feedback.yes': 'Taip',
    'feedback.no': 'Ne',
    'feedback.submit': 'Pateikti atsiliepimą',
    'feedback.submitting': 'Siunčiama...',
    'feedback.successToast': 'Ačiū už atsiliepimą!',
    'feedback.errorToast': 'Nepavyko pateikti atsiliepimo',
    'feedback.validationError': 'Užpildykite visus privalomus laukus',

    // Feedback (admin) — AI vertimas, prašome peržiūrėti
    'feedback.admin.title': 'Atsiliepimai',
    'feedback.admin.summary.total': 'Iš viso',
    'feedback.admin.summary.reviewed': 'Peržiūrėta',
    'feedback.admin.summary.avgRating': 'Vidutinis įvertinimas',
    'feedback.admin.summary.avgSprints': 'Vid. sprintų naudota',
    'feedback.admin.summary.satisfied': 'Patenkinti',
    'feedback.admin.summary.wouldTryAgain': 'Pamėgintų vėl',
    'feedback.admin.summary.bugs': 'Sutiko klaidų',
    'feedback.admin.charts.satisfaction': 'Pasitenkinimas',
    'feedback.admin.charts.reasons': 'Nepasitenkinimo priežastys',
    'feedback.admin.charts.ratings': 'Įvertinimų pasiskirstymas',
    'feedback.admin.filter.all': 'Visi',
    'feedback.admin.filter.reviewed': 'Peržiūrėti',
    'feedback.admin.filter.unreviewed': 'Neperžiūrėti',
    'feedback.admin.filter.satisfied': 'Patenkinti',
    'feedback.admin.filter.unsatisfied': 'Nepatenkinti',
    'feedback.admin.filter.withBugs': 'Su klaidomis',
    'feedback.admin.filter.withoutBugs': 'Be klaidų',
    'feedback.admin.markReviewed': 'Pažymėti peržiūrėtu',
    'feedback.admin.markUnreviewed': 'Pažymėti neperžiūrėtu',
    'feedback.admin.reviewedBy': 'Peržiūrėjo',
    'feedback.admin.empty': 'Atsiliepimų dar nėra',

    // Layout
    'layout.breadcrumbHome': 'Pradžia',
    'layout.breadcrumbOrganizations': 'Organizacijos',
    'layout.breadcrumbProducts': 'Produktai',
    'layout.breadcrumbTeams': 'Komandos',
    'layout.breadcrumbBacklog': 'Darbų sąrašas',
    'layout.breadcrumbBoard': 'Lenta',
    'layout.breadcrumbMetrics': 'Metrikos',
    'layout.breadcrumbAbsences': 'Pravaikštos',
    'layout.breadcrumbAdmin': 'Valdymas',

    // Shared
    'shared.tagAdd': 'Pridėti žymą',
    'shared.tagRemove': 'Pašalinti žymą',
    'shared.workItem': 'Darbo elementas',
    'shared.errorTitle': 'Įvyko klaida',
    'shared.errorMessage': 'Atsiprašome, įvyko netikėta klaida.',
    'shared.errorRefresh': 'Atnaujinti puslapį',
    'shared.errorContact': 'Jei klaida kartojasi, susisiekite su Iterim administratoriais.',
    'shared.confirmTitle': 'Patvirtinkite veiksmą',
    'shared.confirmMessage': 'Ar tikrai norite tęsti?',

    // Retrospective
    'retro.title': 'Retrospektyva',
    'retro.button': 'Retrospektyva',
    'retro.readOnlyBanner': 'Iteracija užbaigta — retrospektyva tik skaitymui.',
    'retro.columnWentWell': 'Kas pavyko gerai',
    'retro.columnDidntGoWell': 'Kas nepavyko',
    'retro.columnActionItem': 'Veiksmai kitam sprintui',
    'retro.addCard': 'Pridėti kortelę',
    'retro.contentPlaceholder': 'Įveskite mintį…',
    'retro.contentRequired': 'Kortelės turinys negali būti tuščias.',
    'retro.empty': 'Šiame stulpelyje dar nėra kortelių.',
    'retro.votes': 'balsai',
    'retro.vote': 'Balsuoti',
    'retro.unvote': 'Atšaukti balsą',
    'retro.editCard': 'Redaguoti kortelę',
    'retro.deleteCard': 'Ištrinti kortelę',
    'retro.deleteConfirm': 'Ar tikrai norite ištrinti šią kortelę?',
    'retro.failedLoad': 'Nepavyko įkelti retrospektyvos.',
    'retro.failedCreate': 'Nepavyko pridėti kortelės.',
    'retro.failedUpdate': 'Nepavyko atnaujinti kortelės.',
    'retro.failedDelete': 'Nepavyko ištrinti kortelės.',
    'retro.failedVote': 'Nepavyko balsuoti.',
    'retro.iterationNotStarted': 'Retrospektyva pasiekiama tik aktyvioms ar užbaigtoms iteracijoms.',

    // Ketvirčio planas
    'quarterPlan.title': 'Ketvirčio planas',
    'quarterPlan.subtitle': 'Strateginė iteracijų ir funkcijų apžvalga.',
    'quarterPlan.recentPageLabel': 'Ketvirčio planas',
    'quarterPlan.quarterShort': 'K',
    'quarterPlan.noIterationsTitle': 'Iteracijų nerasta',
    'quarterPlan.noIterationsDescription': 'Pasirinktame laikotarpyje suplanuotų iteracijų nėra.',
    'quarterPlan.spanningFeatures': 'Apjungiančios funkcijos',
    'quarterPlan.todo': 'Atlikti',
    'quarterPlan.inProgress': 'Vykdoma',
    'quarterPlan.done': 'Užbaigta',
    'quarterPlan.spSuffix': 'TT',
    'quarterPlan.teamCapacity': 'Komandos pajėgumas:',
    'quarterPlan.daysSuffix': 'd.',
    'quarterPlan.noFeatures': 'Šiame laikotarpyje nerasta kelias iteracijas apimančių funkcijų.',
    'quarterPlan.statusPlanning': 'Planuojama',
    'quarterPlan.statusActive': 'Aktyvi',
    'quarterPlan.statusCompleted': 'Užbaigta',

    // Kalbų pavadinimai
    'language.lt': 'Lietuvių',
    'language.en': 'Anglų',
  },
  en: {
    // Common
    'common.loading': 'Loading…',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.saving': 'Saving…',
    'common.delete': 'Delete',
    'common.deleting': 'Deleting…',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.create': 'Create',
    'common.creating': 'Creating…',
    'common.update': 'Update',
    'common.updating': 'Updating…',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.search': 'Search',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.required': 'Required field',
    'common.optional': 'Optional',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.name': 'Name',
    'common.description': 'Description',
    'common.date': 'Date',
    'common.from': 'From',
    'common.to': 'To',
    'common.all': 'All',
    'common.none': 'None',
    'common.unknown': 'Unknown',
    'common.retry': 'Retry',
    'common.refresh': 'Refresh',
    'common.tryAgain': 'Try again',
    'common.openMenu': 'Open menu',
    'common.unauthorized': 'You are not authorized',
    'common.notFound': 'Not found',
    'common.justNow': 'just now',
    'common.minuteAgo': '1 minute ago',
    'common.minutesAgo': '{n} minutes ago',
    'common.hourAgo': '1 hour ago',
    'common.hoursAgo': '{n} hours ago',
    'common.dayAgo': '1 day ago',
    'common.daysAgo': '{n} days ago',

    // Header
    'header.themeToggle.toLight': 'Switch to light mode',
    'header.themeToggle.toDark': 'Switch to dark mode',
    'header.themeToggle.srLabel': 'Toggle theme',
    'header.languageToggle.title': 'Change language',
    'header.languageToggle.srLabel': 'Toggle language',
    'header.adminPanel': 'Admin Panel',
    'header.notifications': 'Notifications',
    'header.openMenu': 'Open menu',
    'header.navigation': 'Navigation',

    // Notifications
    'notifications.dropdownTitle': 'Notifications',
    'notifications.markAllRead': 'Mark all as read',
    'notifications.empty': 'No notifications yet',
    'notifications.emptyDescription': "We'll let you know when something happens.",
    'notifications.loading': 'Loading...',
    'notifications.unreadBadge': '{count} unread',
    'notifications.workItemAssigned.title': 'Work item assigned',
    'notifications.workItemAssigned.message': 'You\'ve been assigned to work item: "{workItemTitle}".',
    'notifications.blockerResolved.title': 'Work item unblocked',
    'notifications.blockerResolved.message': 'Work item "{workItemTitle}" has been unblocked — the blocking work item "{blockerTitle}" was completed.',
    'notifications.addedToTeam.title': 'Added to team',
    'notifications.addedToTeam.message': 'You\'ve been added to the team "{teamName}".',
    'notifications.addedToOrganization.title': 'Invited to organization',
    'notifications.addedToOrganization.message': 'You\'ve been invited to the organization "{organizationName}".',
    'notifications.passwordReset.title': 'Password reset',
    'notifications.passwordReset.message': 'An administrator has initiated a password reset for your account. Check your email for the reset link.',
    'notifications.preferences.title': 'Notifications',
    'notifications.preferences.description': 'Choose which notifications you want to receive.',
    'notifications.preferences.master': 'Enable notifications',
    'notifications.preferences.masterDescription': "Master switch — when off, you won't receive any notifications.",
    'notifications.preferences.workItemAssigned': 'Work item assignments',
    'notifications.preferences.blockerResolved': 'Blocker resolved',
    'notifications.preferences.addedToTeam': 'Added to a team',
    'notifications.preferences.addedToOrganization': 'Added to an organization',
    'notifications.preferences.passwordResetNote': "Password reset notifications can't be turned off.",
    'notifications.preferences.savedToast': 'Notification preferences saved',
    'notifications.preferences.errorToast': 'Could not save preferences',

    // Markdown
    'markdown.helperText': 'Supports Markdown formatting',
    'markdown.tabEdit': 'Edit',
    'markdown.tabPreview': 'Preview',
    'markdown.emptyPlaceholder': 'Click to add a description...',

    // User menu
    'user.profile': 'Profile',
    'user.logout': 'Logout',
    'user.fallbackName': 'User',

    // Sidebar
    'sidebar.dashboard': 'Dashboard',
    'sidebar.pinned': 'Pinned',
    'sidebar.myOrganizations': 'My Organizations',
    'sidebar.recentPages': 'Recent Pages',
    'sidebar.logout': 'Logout',
    'sidebar.editProfile': 'Edit profile',

    // Auth
    'auth.welcomeBack': 'Welcome back',
    'auth.signInSubtitle': 'Sign in to continue to your workspace',
    'auth.signIn': 'Sign in',
    'auth.signingIn': 'Signing in…',
    'auth.emailAddress': 'Email address',
    'auth.emailPlaceholder': 'you@example.com',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': '••••••••',
    'auth.forgotPassword': 'Forgot password?',
    'auth.passwordResetSuccess': 'Password changed successfully. You can now sign in.',
    'auth.emailNotConfirmed': 'Email not confirmed',
    'auth.emailNotConfirmedMessage': 'You need to confirm your email address before signing in. Please check your inbox.',
    'auth.resendConfirmation': 'Resend confirmation email',
    'auth.sending': 'Sending…',
    'auth.confirmationLinkSent': 'Confirmation link sent',
    'auth.failedToSend': 'Failed to send. Please try again later.',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.createOne': 'Create one',
    'auth.showPassword': 'Show password',
    'auth.hidePassword': 'Hide password',
    'auth.loginFailed': 'Login failed.',
    'auth.createAccount': 'Create your account',
    'auth.signUpSubtitle': 'Get started with Iterim',
    'auth.fullName': 'Full name',
    'auth.fullNamePlaceholder': 'Jane Doe',
    'auth.confirmPassword': 'Confirm password',
    'auth.signUp': 'Sign up',
    'auth.signingUp': 'Signing up…',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.signInLink': 'Sign in',
    'auth.passwordsDontMatch': "Passwords don't match",
    'auth.registrationFailed': 'Registration failed.',
    'auth.passwordRequirementsNotMet': 'Password does not meet requirements',
    'auth.pwdReqLength': '8+ characters',
    'auth.pwdReqUpper': 'Uppercase letter',
    'auth.pwdReqLower': 'Lowercase letter',
    'auth.pwdReqNumber': 'Number',
    'auth.forgotTitle': 'Forgot password?',
    'auth.forgotSubtitle': 'Enter your email — we will send you a reset link.',
    'auth.sendResetLink': 'Send reset link',
    'auth.sendingResetLink': 'Sending…',
    'auth.resetLinkSent': 'If that email exists, a reset link has been sent.',
    'auth.backToSignIn': 'Back to sign in',
    'auth.resetTitle': 'Set a new password',
    'auth.resetSubtitle': 'Enter a new password for your account.',
    'auth.newPassword': 'New password',
    'auth.changePassword': 'Change password',
    'auth.changingPassword': 'Changing…',
    'auth.checkEmailTitle': 'Check your email',
    'auth.checkEmailSubtitle': 'We sent you a confirmation link. Click it to activate your account.',
    'auth.confirmingEmail': 'Confirming…',
    'auth.emailConfirmed': 'Email confirmed successfully!',
    'auth.confirmFailed': 'Failed to confirm your email.',
    'auth.goToLogin': 'Go to sign in',
    'auth.invalidResetLink': 'Invalid reset link',
    'auth.resetTokenMissing': 'Reset token is missing.',
    'auth.resetTokenInvalid': 'The reset token is invalid or has expired.',
    'auth.openInbox': 'Open inbox',
    'auth.didntReceive': "Didn't get the email?",
    'auth.weWillRedirect': 'You will be redirected shortly…',

    // Validation
    'validation.emailRequired': 'Email is required',
    'validation.emailInvalid': 'Invalid email address',
    'validation.passwordRequired': 'Password is required',
    'validation.passwordTooShort': 'Password is too short',
    'validation.nameRequired': 'Name is required',
    'validation.confirmPasswordRequired': 'Please confirm your password',
    'validation.fieldRequired': 'This field is required',
    'validation.tooShort': 'Value is too short',
    'validation.tooLong': 'Value is too long',
    'validation.dateInvalid': 'Invalid date',
    'validation.endBeforeStart': 'End date must be after start date',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome,',
    'dashboard.myTeams': 'My Teams',
    'dashboard.noTeams': "You don't belong to any teams yet.",
    'dashboard.viewAll': 'View all',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.upcomingAbsences': 'Upcoming Absences',
    'dashboard.assignedToMe': 'Assigned to me',
    'dashboard.noAssignedItems': 'You have no assigned work items yet.',
    'dashboard.activeIterations': 'Active Iterations',
    'dashboard.noActiveIterations': 'No active iterations at the moment.',
    'dashboard.recentItems': 'Recent Work Items',
    'dashboard.noRecentItems': 'No recent work items.',
    'dashboard.upcomingDeadlines': 'Upcoming Deadlines',
    'dashboard.noUpcomingDeadlines': 'No upcoming deadlines.',
    'dashboard.myOrganizations': 'My Organizations',
    'dashboard.noOrganizations': "You don't belong to any organizations yet.",
    'dashboard.createOrganization': 'Create Organization',
    'dashboard.invitations': 'Invitations',
    'dashboard.noInvitations': 'No new invitations.',
    'dashboard.greetingMorning': 'Good morning',
    'dashboard.greetingAfternoon': 'Good afternoon',
    'dashboard.greetingEvening': 'Good evening',
    'dashboard.sectionWork': 'Work',
    'dashboard.sectionWorkspace': 'Workspace',
    'dashboard.sectionQuickAccess': 'Quick Access',
    'dashboard.noPinnedTeams': 'No pinned teams yet. Pin a team from the sidebar.',
    'dashboard.noProducts': 'No products',
    'dashboard.noTeamsInProduct': 'No teams',
    'dashboard.noRecentActivity': 'No recent activity.',
    'dashboard.activity.createdItem': 'created a new item',
    'dashboard.activity.updatedItem': 'updated an item',
    'dashboard.activity.commented': 'commented',
    'dashboard.blockedWork': 'Blocked Work',
    'dashboard.noBlockedWork': 'None of your work items are currently blocked.',
    'dashboard.blockedBy': 'Blocked by',
    'dashboard.blockerDone': 'Done',
    'dashboard.blockerNotDone': 'Not done',
    'dashboard.unfinishedBlockers': 'unfinished blockers',

    // Organizations
    'organizations.title': 'Organizations',
    'organizations.create': 'Create organization',
    'organizations.createTitle': 'Create new organization',
    'organizations.created': 'Organization created',
    'organizations.deleted': 'Organization deleted',
    'organizations.createDescription': 'Create an organization to manage teams and products.',
    'organizations.namePlaceholder': 'e.g., Iterim Ltd.',
    'organizations.descriptionPlaceholder': 'Brief description of the organization',
    'organizations.members': 'Members',
    'organizations.member': 'Member',
    'organizations.addMember': 'Add member',
    'organizations.addMemberTitle': 'Add member',
    'organizations.addMemberDescription': 'Enter an email to invite a member to this organization.',
    'organizations.removeMember': 'Remove member',
    'organizations.invitations': 'Invitations',
    'organizations.pendingInvitations': 'Pending invitations',
    'organizations.noPendingInvitations': 'No pending invitations.',
    'organizations.acceptInvitation': 'Accept',
    'organizations.declineInvitation': 'Decline',
    'organizations.role': 'Role',
    'organizations.roleOwner': 'Owner',
    'organizations.roleAdmin': 'Admin',
    'organizations.roleMember': 'Member',
    'organizations.invite': 'Invite',
    'organizations.inviteSent': 'Invitation sent',
    'organizations.invited': 'Invited',
    'organizations.leave': 'Leave organization',
    'organizations.leaveConfirm': 'Are you sure you want to leave this organization?',
    'organizations.deleteConfirm': 'Are you sure you want to delete this organization?',
    'organizations.deleteWarning': 'This action is irreversible. All related data will be deleted.',
    'organizations.noOrganizations': 'No organizations yet.',
    'organizations.createFirst': 'Create your first organization',
    'organizations.products': 'Products',
    'organizations.teams': 'Teams',
    'organizations.settings': 'Settings',
    'organizations.overview': 'Overview',
    'organizations.failedLoad': 'Failed to load organizations.',
    'organizations.failedCreate': 'Failed to create organization.',
    'organizations.failedDelete': 'Failed to delete organization.',
    'organizations.failedInvite': 'Failed to send invitation.',
    'organizations.memberRemoved': 'Member removed successfully',
    'organizations.memberInvited': 'Member invited successfully',
    'organizations.roleUpdated': 'Member role updated successfully',
    'organizations.failedRoleUpdate': 'Failed to update member role.',
    'organizations.changeRoleConfirm': "Are you sure you want to change this member's role?",
    'organizations.cannotChangeOwnRole': 'You cannot change your own role',
    'organizations.cannotChangeOwnerRole': "The owner's role cannot be changed",
    'organizations.cannotChangeOtherAdminRole': 'Only the owner or the admin who granted this role can change it',
    'organizations.email': 'Email',
    'organizations.absence': 'Absence',
    'organizations.activeMembers': 'Active Members',
    'organizations.manageAbsences': 'Manage Absences',
    'organizations.registerAbsence': 'Register',
    'organizations.noAccess': 'No access',
    'organizations.tags': 'Tags',
    'organizations.addTag': 'Add Tag',
    'organizations.tagNamePlaceholder': 'Tag name (e.g. frontend)',
    'organizations.noTags': 'No tags yet. Create tags to use them in work items and assign them to team members.',
    'organizations.tagCreated': 'Tag created',
    'organizations.tagDeleted': 'Tag deleted',
    'organizations.failedCreateTag': 'Failed to create tag',
    'organizations.failedDeleteTag': 'Failed to delete tag',
    'organizations.roleViewer': 'Viewer',
    'organizations.slug': 'Slug',

    // Products
    'products.title': 'Products',
    'products.create': 'Create product',
    'products.created': 'Product created',
    'products.updated': 'Product updated',
    'products.deleted': 'Product deleted',
    'products.createTitle': 'Create new product',
    'products.editTitle': 'Edit product',
    'products.namePlaceholder': 'Product name',
    'products.descriptionPlaceholder': 'Product description',
    'products.owner': 'Product owner',
    'products.organization': 'Organization',
    'products.status': 'Status',
    'products.statusActive': 'Active',
    'products.statusArchived': 'Archived',
    'products.statusDraft': 'Draft',
    'products.deleteConfirm': 'Are you sure you want to delete this product?',
    'products.noProducts': 'No products yet.',
    'products.createFirst': 'Create your first product',
    'products.failedLoad': 'Failed to load products.',
    'products.failedCreate': 'Failed to create product.',
    'products.failedUpdate': 'Failed to update product.',
    'products.failedDelete': 'Failed to delete product.',
    'products.backlog': 'Backlog',
    'products.board': 'Board',
    'products.metrics': 'Metrics',
    'products.team': 'Team',
    'products.iterations': 'Iterations',
    'products.overview': 'Overview',
    'products.details': 'Product Details',
    'products.productId': 'Product ID',
    'products.createdBy': 'Created By',
    'products.updatedBy': 'Updated By',

    // Teams
    'teams.title': 'Teams',
    'teams.create': 'Create team',
    'teams.updated': 'Team updated',
    'teams.memberAdded': 'Member added',
    'teams.memberRemoved': 'Member removed',
    'teams.createTitle': 'Create new team',
    'teams.editTitle': 'Edit team',
    'teams.namePlaceholder': 'Team name',
    'teams.descriptionPlaceholder': 'Team description',
    'teams.members': 'Members',
    'teams.lead': 'Team lead',
    'teams.capacity': 'Capacity',
    'teams.capacityHours': 'Hours per iteration',
    'teams.addMember': 'Add member',
    'teams.addMemberTitle': 'Add team member',
    'teams.removeMember': 'Remove member',
    'teams.removeMemberConfirm': 'Are you sure you want to remove this member from the team?',
    'teams.deleteConfirm': 'Are you sure you want to delete this team?',
    'teams.noTeams': 'No teams yet.',
    'teams.createFirst': 'Create your first team',
    'teams.failedLoad': 'Failed to load teams.',
    'teams.failedCreate': 'Failed to create team.',
    'teams.failedUpdate': 'Failed to update team.',
    'teams.failedDelete': 'Failed to delete team.',
    'teams.role': 'Role',
    'teams.roleLead': 'Lead',
    'teams.roleMember': 'Member',
    'teams.roleAdmin': 'Admin',
    'teams.roleViewer': 'Viewer',
    'teams.cannotChangeOwnRole': 'You cannot change your own role',
    'teams.cannotChangeCreatorRole': "The team creator's role cannot be changed",
    'teams.cannotChangeOtherAdminRole': 'Only the team creator, the product creator, or the admin who granted this role can change it',
    'teams.roleCreator': 'Creator',
    'teams.information': 'Team Information',
    'teams.teamId': 'Team ID',
    'teams.created': 'Created',
    'teams.lastUpdated': 'Last Updated',
    'teams.createdBy': 'by',
    'teams.noMembers': 'No members in this team yet.',

    // Backlog
    'backlog.selected': 'selected',
    'backlog.moveTo': 'Move to...',
    'backlog.movingItems': 'Moving items:',
    'backlog.title': 'Backlog',
    'backlog.addItem': 'Add work item',
    'backlog.createItemTitle': 'Create work item',
    'backlog.editItemTitle': 'Edit work item',
    'backlog.itemTitle': 'Title',
    'backlog.itemTitlePlaceholder': 'Short work item title',
    'backlog.itemDescription': 'Description',
    'backlog.itemDescriptionPlaceholder': 'More detailed description',
    'backlog.type': 'Type',
    'backlog.typeStory': 'Story',
    'backlog.typeBug': 'Bug',
    'backlog.typeTask': 'Task',
    'backlog.typeEpic': 'Epic',
    'backlog.priority': 'Priority',
    'backlog.priorityLow': 'Low',
    'backlog.priorityMedium': 'Medium',
    'backlog.priorityHigh': 'High',
    'backlog.priorityCritical': 'Critical',
    'backlog.status': 'Status',
    'backlog.statusNew': 'New',
    'backlog.statusInProgress': 'In progress',
    'backlog.statusReview': 'Review',
    'backlog.statusDone': 'Done',
    'backlog.blockedStatusHint': 'This item has unfinished blockers — it cannot move to In Progress, Review or Done until they are resolved.',
    'backlog.statusBlocked': 'Blocked',
    'backlog.points': 'Points',
    'backlog.assignee': 'Assignee',
    'backlog.unassigned': 'Unassigned',
    'backlog.tags': 'Tags',
    'backlog.addTag': 'Add tag',
    'backlog.filters': 'Filters',
    'backlog.sortBy': 'Sort by',
    'backlog.noItems': 'No items in the backlog.',
    'backlog.searchPlaceholder': 'Search work items…',
    'backlog.iteration': 'Iteration',
    'backlog.createIteration': 'Create iteration',
    'backlog.editIteration': 'Edit iteration',
    'backlog.completeIteration': 'Complete iteration',
    'backlog.iterationName': 'Iteration name',
    'backlog.iterationStartDate': 'Start date',
    'backlog.iterationEndDate': 'End date',
    'backlog.iterationGoal': 'Iteration goal',
    'backlog.dependencies': 'Dependencies',
    'backlog.addDependency': 'Add dependency',
    'backlog.dependencyType': 'Dependency type',
    'backlog.blocks': 'Blocks',
    'backlog.blockedBy': 'Blocked by',
    'backlog.relatesTo': 'Relates to',
    'backlog.duplicates': 'Duplicates',
    'backlog.deleteItemConfirm': 'Are you sure you want to delete this work item?',
    'backlog.failedLoad': 'Failed to load backlog.',
    'backlog.failedCreate': 'Failed to create work item.',
    'backlog.failedUpdate': 'Failed to update work item.',
    'backlog.failedDelete': 'Failed to delete work item.',
    'backlog.completeConfirm': 'Are you sure you want to complete this iteration?',
    'backlog.moveUnfinishedTo': 'Move unfinished items to',
    'backlog.dependencyDetails': 'Dependency details',
    'backlog.removeDependency': 'Remove dependency',
    'backlog.transferItem': 'Transfer to another team',
    'backlog.transferItemConfirm': 'Confirm transfer',
    'backlog.transferItemTitle': 'Transfer to another team',
    'backlog.transferItemDescription': 'The work item will be removed from the current iteration and the assignee will be cleared. Dependencies will be preserved.',
    'backlog.transferItemTargetLabel': 'Select target team',
    'backlog.transferItemTargetPlaceholder': 'Choose a team',
    'backlog.transferItemSelectedLabel': 'To team',
    'backlog.transferItemLoading': 'Loading team list...',
    'backlog.transferItemNoTeams': 'There are no other teams in this organization.',
    'backlog.transferItemNoProductTeams': 'There are no other teams in this product.',
    'backlog.transferItemSubmitting': 'Transferring...',
    'backlog.transferItemSuccess': 'Work item transferred successfully.',
    'backlog.transferItemUnauthorized': 'You do not have permission to transfer this work item',
    'backlog.transferItemFailedLoad': 'Failed to load team list.',
    'backlog.transferItemFailed': 'Failed to transfer work item.',
    'backlog.editItemDescription': 'Update work item fields and save changes.',
    'backlog.allTypes': 'All Types',
    'backlog.allStatuses': 'All Statuses',
    'backlog.allAssignees': 'All Assignees',
    'backlog.allTags': 'All Tags',
    'backlog.statusBacklog': 'Backlog',
    'backlog.statusTodo': 'To Do',
    'backlog.dragHelp': 'Drag items between sections to plan iterations',
    'backlog.dragHere': 'Drag items here to plan this iteration',
    'backlog.showCompleted': 'Show completed',
    'backlog.completedCount': 'completed',
    'backlog.comments': 'Comments',
    'backlog.commentsLoading': 'Loading comments…',
    'backlog.commentsEmpty': 'No comments yet',
    'backlog.commentsEdited': '(edited)',
    'backlog.commentsPlaceholder': 'Write a comment… (Ctrl+Enter to submit)',
    'backlog.commentsPosting': 'Posting…',
    'backlog.commentsPost': 'Comment',
    'backlog.commentsDeleteTitle': 'Delete comment?',
    'backlog.commentsDeleteDesc': 'This action cannot be undone.',
    'backlog.commentsFailedAdd': 'Failed to add comment',
    'backlog.commentsFailedUpdate': 'Failed to update comment',
    'backlog.commentsFailedDelete': 'Failed to delete comment',
    'backlog.iterationStatusPlanning': 'Planning',
    'backlog.iterationStatusActive': 'Active',
    'backlog.iterationStatusCompleted': 'Completed',
    'backlog.startIteration': 'Start',
    'backlog.addItemsFirst': 'Add items before starting',
    'backlog.doneCount': 'done',

    // ATPA
    'atpa.suggestButton': 'Suggest assignments',
    'atpa.title': 'Assignment suggestions',
    'atpa.subtitle': 'The automatic task-assignment algorithm proposed these assignments based on tags and member capacity.',
    'atpa.loading': 'Computing suggestions…',
    'atpa.empty': 'No new suggestions.',
    'atpa.allAssigned': 'All work items in this iteration are already assigned.',
    'atpa.applyAll': 'Apply all',
    'atpa.applyingAll': 'Applying…',
    'atpa.apply': 'Accept',
    'atpa.applying': 'Applying…',
    'atpa.reject': 'Reject',
    'atpa.confidence': 'Confidence',
    'atpa.matchingTags': 'Matching tags',
    'atpa.reason': 'Reason',
    'atpa.warnings': 'Warnings',
    'atpa.warningOverloaded': 'Overloaded',
    'atpa.warningOversized': 'Oversized work item',
    'atpa.warningUnmatched': 'Tags don’t match',
    'atpa.warningNoCapacity': 'No free capacity',
    'atpa.unassigned': 'Unassigned',
    'atpa.unassignedHint': 'No matching member found by the algorithm.',
    'atpa.capacity': 'Team capacity',
    'atpa.capacityBefore': 'Before',
    'atpa.capacityAfter': 'After applying',
    'atpa.scheduleFullTime': 'Full-time',
    'atpa.schedulePartTime': 'Part-time',
    'atpa.scheduleCustom': 'Custom',
    'atpa.suggestedFor': 'Suggested',
    'atpa.failedLoad': 'Failed to load suggestions.',
    'atpa.appliedToast': 'Suggestions applied',
    'atpa.partialAppliedToast': 'Some suggestions could not be applied.',
    'atpa.failedApply': 'Failed to apply suggestion.',
    'atpa.noActiveIteration': 'Select a planning or active iteration.',

    // ATPA – warning code translations ({title}, {sp}, {name} are placeholders from messageParams)
    'atpa.code.NO_TEAM_MEMBERS': 'Team has no members; cannot suggest assignments.',
    'atpa.code.NO_TAG_MATCH': '"{title}" has tags no member shares (neither explicit nor inferred); assigned by capacity only.',
    'atpa.code.SP_EXCEEDS_CAPACITY': '"{title}" SP ({sp}) exceeds every member’s capacity — consider splitting.',
    'atpa.code.ALL_MEMBERS_OVERLOADED': 'Couldn’t assign "{title}" — all members are at capacity.',
    'atpa.code.MEMBER_OVERLOADED': '{name} reached capacity — no further items can be assigned.',

    // ATPA – reason code translations (tag part + capacity part)
    'atpa.reason.NO_TAGS_CAPACITY_BASED': 'no tags, decision based on capacity',
    'atpa.reason.TAG_FULL_MATCH': 'all tags match',
    'atpa.reason.TAG_PARTIAL_MATCH': 'partial tag match',
    'atpa.reason.TAG_INFERRED_FULL': 'all tags match via member history',
    'atpa.reason.TAG_INFERRED_PARTIAL': 'partial match via member history',
    'atpa.reason.TAG_MIXED_MATCH': 'matches via tags and history ({explicitMatchCount} expl. + {inferredMatchCount} infer.)',
    'atpa.reason.TAG_NO_MATCH': 'no tag overlap',
    'atpa.reason.CAPACITY_HIGH': 'most available capacity',
    'atpa.reason.CAPACITY_MEDIUM': 'decent free capacity',
    'atpa.reason.CAPACITY_LOW': 'limited free capacity',

    // ATPA – unassigned reason codes
    'atpa.unassignedReason.OVERSIZED': '"{title}" SP ({sp}) exceeds every member’s full capacity.',
    'atpa.unassignedReason.ALL_FULL': 'All members full or SP ({sp}) exceeds every member’s remaining capacity.',
    'atpa.unassignedReason.ALL_FULL_NO_SP': 'All members are full — no remaining capacity.',

    // Board
    'board.title': 'Board',
    'board.todo': 'To do',
    'board.inProgress': 'In progress',
    'board.review': 'Review',
    'board.done': 'Done',
    'board.blocked': 'Blocked',
    'board.noItemsInColumn': 'No items in this column.',
    'board.noActiveIteration': 'No active iterations.',
    'board.selectIteration': 'Select an iteration',
    'board.dragHint': 'Drag cards between columns.',
    'board.blockerError': 'Cannot move blocked item',
    'board.blockerErrorMessage': 'This work item has unresolved blocking dependencies.',
    'board.cannotMoveBlocked': 'Cannot move a blocked item.',
    'board.failedLoad': 'Failed to load board.',
    'board.failedMove': 'Failed to move item.',
    'board.noTags': 'No tags',

    // Metrics
    'metrics.title': 'Metrics',
    'metrics.velocity': 'Velocity',
    'metrics.velocityDescription': 'Average team velocity per iteration.',
    'metrics.burndown': 'Burndown',
    'metrics.burndownDescription': 'Remaining work over the course of the iteration.',
    'metrics.burnup': 'Burnup',
    'metrics.capacity': 'Capacity',
    'metrics.capacityDescription': 'Team capacity for this iteration.',
    'metrics.sprintProgress': 'Iteration progress',
    'metrics.sprintProgressDescription': 'Progress of the current iteration.',
    'metrics.throughput': 'Throughput',
    'metrics.cycleTime': 'Cycle time',
    'metrics.leadTime': 'Lead time',
    'metrics.completed': 'Completed',
    'metrics.remaining': 'Remaining',
    'metrics.committed': 'Committed',
    'metrics.inProgress': 'In progress',
    'metrics.dateRange': 'Date range',
    'metrics.lastNSprints': 'Last iterations',
    'metrics.points': 'Points',
    'metrics.day': 'Day',
    'metrics.ideal': 'Ideal',
    'metrics.actual': 'Actual',
    'metrics.noData': 'No data available.',
    'metrics.failedLoad': 'Failed to load metrics.',

    // Absences
    'absences.title': 'Absences',
    'absences.create': 'Add absence',
    'absences.createTitle': 'New absence',
    'absences.editTitle': 'Edit absence',
    'absences.type': 'Type',
    'absences.typeVacation': 'Vacation',
    'absences.typeSick': 'Sick leave',
    'absences.typePersonal': 'Personal',
    'absences.typeOther': 'Other',
    'absences.startDate': 'Start date',
    'absences.endDate': 'End date',
    'absences.startTime': 'Start time',
    'absences.endTime': 'End time',
    'absences.timeRange': 'Time',
    'absences.reason': 'Reason',
    'absences.reasonPlaceholder': 'Brief explanation',
    'absences.status': 'Status',
    'absences.statusPending': 'Pending',
    'absences.statusApproved': 'Approved',
    'absences.statusRejected': 'Rejected',
    'absences.approve': 'Approve',
    'absences.reject': 'Reject',
    'absences.deleteConfirm': 'Are you sure you want to delete this absence?',
    'absences.noAbsences': 'No absences.',
    'absences.failedLoad': 'Failed to load absences.',
    'absences.failedCreate': 'Failed to create absence.',
    'absences.failedUpdate': 'Failed to update absence.',
    'absences.failedDelete': 'Failed to delete absence.',
    'absences.registerAbsence': 'Register Absence',
    'absences.searchMember': 'Search member name...',
    'absences.clear': 'Clear',
    'absences.allTypes': 'All Types',
    'absences.typeFilterPlaceholder': 'Type',
    'absences.typeAbsent': 'Absent',
    'absences.typeLate': 'Late',
    'absences.subtitle': 'Upcoming Absences',
    'absences.noResults': 'No results found for the current filters.',
    'absences.noActiveMembership': 'No active membership found',

    // Profile
    'profile.title': 'Profile',
    'profile.personalInfo': 'Personal info',
    'profile.preferences': 'Preferences',
    'profile.security': 'Security',
    'profile.fullName': 'Full name',
    'profile.email': 'Email',
    'profile.role': 'Role',
    'profile.avatar': 'Avatar',
    'profile.changeAvatar': 'Change avatar',
    'profile.removeAvatar': 'Remove avatar',
    'profile.language': 'Language',
    'profile.theme': 'Theme',
    'profile.notifications': 'Notifications',
    'profile.changePassword': 'Change password',
    'profile.currentPassword': 'Current password',
    'profile.newPassword': 'New password',
    'profile.confirmNewPassword': 'Confirm new password',
    'profile.saved': 'Changes saved successfully',
    'profile.failedSave': 'Failed to save changes.',
    'profile.deleteAccount': 'Delete account',
    'profile.deleteAccountConfirm': 'Are you sure you want to delete your account? This action is irreversible.',

    // Admin
    'admin.usersTitle': 'User management',
    'admin.systemTitle': 'System information',
    'admin.sidebarUsers': 'Users',
    'admin.sidebarSystem': 'System',
    'admin.sidebarFeedback': 'Feedback',
    'admin.allUsers': 'All users',
    'admin.addUser': 'Add user',
    'admin.editUser': 'Edit user',
    'admin.deleteUser': 'Delete user',
    'admin.deleteUserConfirm': 'Are you sure you want to delete this user?',
    'admin.suspend': 'Suspend',
    'admin.activate': 'Activate',
    'admin.role': 'Role',
    'admin.roleAdmin': 'Admin',
    'admin.roleUser': 'User',
    'admin.status': 'Status',
    'admin.statusActive': 'Active',
    'admin.statusSuspended': 'Suspended',
    'admin.lastLogin': 'Last login',
    'admin.never': 'Never',
    'admin.systemHealth': 'System health',
    'admin.systemVersion': 'Version',
    'admin.systemUptime': 'Uptime',
    'admin.totalUsers': 'Total users',
    'admin.activeUsers': 'Active users',
    'admin.totalOrganizations': 'Total organizations',
    'admin.totalProducts': 'Total products',
    'admin.failedLoad': 'Failed to load data.',
    'admin.search': 'Search users…',
    'admin.sidebarOrganizations': 'Organizations',
    'admin.totalTeams': 'Total teams',
    'admin.totalWorkItems': 'Total work items',
    'admin.totalIterations': 'Total iterations',
    'admin.usersTotal': 'Total',
    'admin.usersNewThisWeek': 'New this week',
    'admin.usersNewThisMonth': 'New this month',
    'admin.usersBlocked': 'Blocked',
    'admin.usersUnconfirmed': 'Unconfirmed email',
    'admin.workItemsByStatus': 'Work items by status',
    'admin.lastRefresh': 'Last refresh:',
    'admin.rawJson': 'Raw JSON',
    'admin.healthHealthy': 'Healthy',
    'admin.healthDegraded': 'Degraded',
    'admin.healthUnhealthy': 'Unhealthy',
    'admin.healthConnected': 'Connected and responding',
    'admin.healthConnectionFailed': 'Connection failed',
    'admin.healthResponseTime': 'Response time:',
    'admin.healthHighUsage': 'High usage — consider restarting',
    'admin.healthNormalUsage': 'Normal usage',
    'admin.healthOverall': 'Overall:',
    'admin.orgsTitle': 'System Administration',
    'admin.orgsDescription': 'Manage all organizations across the platform.',
    'admin.orgsSearchPlaceholder': 'Search organizations…',
    'admin.orgsColMembers': 'Members',
    'admin.orgsColProducts': 'Products',
    'admin.orgsColTeams': 'Teams',
    'admin.orgsColCreated': 'Created',
    'admin.orgsColLastActivity': 'Last Activity',
    'admin.orgsNotFound': 'No organizations found matching your search.',
    'admin.orgsUnknown': 'Unknown',
    'admin.orgsNever': 'Never',
    'admin.orgsViewDetails': 'View Details',
    'admin.orgsDeleteOrg': 'Delete Organization',
    'admin.orgsDetailTitle': 'Organization Details',
    'admin.orgsDetailCreated': 'Created:',
    'admin.orgsDetailSlug': 'Slug:',
    'admin.orgsDetailMembers': 'Members',
    'admin.orgsDetailProducts': 'Products & Teams',
    'admin.orgsNoProducts': 'No products found.',
    'admin.orgsNoTeams': 'No teams',
    'admin.orgsDeleteTitle': 'Delete Organization',
    'admin.orgsDeleteConfirm': 'Are you absolutely sure? This will permanently delete the organization and ALL of its products, teams, work items, and members. This action cannot be undone.',
    'admin.orgsDeleting': 'Deleting…',
    'admin.orgsDeletePermanently': 'Permanently Delete',
    'admin.orgsFailedLoad': 'Failed to load organizations.',
    'admin.orgsFailedDetails': 'Failed to load organization details.',
    'admin.orgsDeletedSuccess': 'Organization successfully deleted.',
    'admin.orgsFailedDelete': 'Failed to delete organization.',

    // Feedback (user form)
    'feedback.headerTitle': 'Feedback form',
    'feedback.headerSubtitle': 'Share your experience with Iterim. Your feedback helps us improve the system.',
    'feedback.headerButton': 'Feedback',
    'feedback.section.usage': 'Usage',
    'feedback.section.satisfaction': 'Satisfaction',
    'feedback.section.reasons': 'Select reasons',
    'feedback.section.followUps': 'Follow-up questions',
    'feedback.section.usefulFeature': 'Most useful feature',
    'feedback.section.bugs': 'Bugs',
    'feedback.section.future': 'Future',
    'feedback.field.sprintsUsed': 'How many sprints did you use Iterim?',
    'feedback.field.sprintsUsedHint': 'Enter a number (e.g. 2)',
    'feedback.field.overallRating': 'Overall rating',
    'feedback.field.wasSatisfied': 'Was your experience satisfying?',
    'feedback.field.dissatisfactionReasons': 'Why were you dissatisfied? (select all that apply)',
    'feedback.field.missedFunctionalities': 'What functionalities did you miss?',
    'feedback.field.hardestToFind': 'Which functions were hardest to find?',
    'feedback.field.daysToGetUsedTo': 'How many working days did it take to get used to it?',
    'feedback.field.missedIntegrations': 'What program integration did you miss?',
    'feedback.field.acceptablePrice': 'What price would be acceptable to you?',
    'feedback.field.acceptablePriceHint': 'EUR per month per user',
    'feedback.field.otherReason': 'Please describe',
    'feedback.field.unmentionedFlaw': 'Please write down the flaw',
    'feedback.field.mostUsefulFeature': 'Which feature was most useful to you? (optional)',
    'feedback.field.encounteredBugs': 'Did you encounter any bugs?',
    'feedback.field.bugContext': 'What were you doing when the bug occurred?',
    'feedback.field.wouldTryAgain': 'Would you try Iterim again after a few updates?',
    'feedback.reason.MissingFunctionality': 'Lacking in functionality',
    'feedback.reason.EasyToGetLost': 'Easy to get lost',
    'feedback.reason.DifficultToStart': 'Difficult to start using',
    'feedback.reason.MissingIntegration': 'Lacked a critical program integration',
    'feedback.reason.NotVisuallyAppealing': 'Too unappealing visually',
    'feedback.reason.NotUpToStandards': 'Not up to company\'s standards',
    'feedback.reason.TooExpensive': 'Too expensive',
    'feedback.reason.Other': 'Other',
    'feedback.reason.UnmentionedFlaw': 'A flaw not mentioned',
    'feedback.yes': 'Yes',
    'feedback.no': 'No',
    'feedback.submit': 'Submit feedback',
    'feedback.submitting': 'Submitting...',
    'feedback.successToast': 'Thank you for your feedback!',
    'feedback.errorToast': 'Failed to submit feedback',
    'feedback.validationError': 'Please fill in all required fields',

    // Feedback (admin)
    'feedback.admin.title': 'Feedback',
    'feedback.admin.summary.total': 'Total',
    'feedback.admin.summary.reviewed': 'Reviewed',
    'feedback.admin.summary.avgRating': 'Average rating',
    'feedback.admin.summary.avgSprints': 'Avg. sprints used',
    'feedback.admin.summary.satisfied': 'Satisfied',
    'feedback.admin.summary.wouldTryAgain': 'Would try again',
    'feedback.admin.summary.bugs': 'Encountered bugs',
    'feedback.admin.charts.satisfaction': 'Satisfaction',
    'feedback.admin.charts.reasons': 'Dissatisfaction reasons',
    'feedback.admin.charts.ratings': 'Rating distribution',
    'feedback.admin.filter.all': 'All',
    'feedback.admin.filter.reviewed': 'Reviewed',
    'feedback.admin.filter.unreviewed': 'Unreviewed',
    'feedback.admin.filter.satisfied': 'Satisfied',
    'feedback.admin.filter.unsatisfied': 'Unsatisfied',
    'feedback.admin.filter.withBugs': 'With bugs',
    'feedback.admin.filter.withoutBugs': 'Without bugs',
    'feedback.admin.markReviewed': 'Mark as reviewed',
    'feedback.admin.markUnreviewed': 'Mark as unreviewed',
    'feedback.admin.reviewedBy': 'Reviewed by',
    'feedback.admin.empty': 'No feedback yet',

    // Layout
    'layout.breadcrumbHome': 'Home',
    'layout.breadcrumbOrganizations': 'Organizations',
    'layout.breadcrumbProducts': 'Products',
    'layout.breadcrumbTeams': 'Teams',
    'layout.breadcrumbBacklog': 'Backlog',
    'layout.breadcrumbBoard': 'Board',
    'layout.breadcrumbMetrics': 'Metrics',
    'layout.breadcrumbAbsences': 'Absences',
    'layout.breadcrumbAdmin': 'Administration',

    // Shared
    'shared.tagAdd': 'Add tag',
    'shared.tagRemove': 'Remove tag',
    'shared.workItem': 'Work item',
    'shared.errorTitle': 'Something went wrong',
    'shared.errorMessage': 'Sorry, an unexpected error occurred.',
    'shared.errorRefresh': 'Refresh page',
    'shared.errorContact': 'If the error persists, please contact support.',
    'shared.confirmTitle': 'Confirm action',
    'shared.confirmMessage': 'Are you sure you want to continue?',

    // Retrospective
    'retro.title': 'Retrospective',
    'retro.button': 'Retrospective',
    'retro.readOnlyBanner': 'Iteration is completed — retrospective is read-only.',
    'retro.columnWentWell': 'Went Well',
    'retro.columnDidntGoWell': "Didn't Go Well",
    'retro.columnActionItem': 'Action Items',
    'retro.addCard': 'Add card',
    'retro.contentPlaceholder': 'Type your note…',
    'retro.contentRequired': 'Card content cannot be empty.',
    'retro.empty': 'No cards in this column yet.',
    'retro.votes': 'votes',
    'retro.vote': 'Vote',
    'retro.unvote': 'Remove vote',
    'retro.editCard': 'Edit card',
    'retro.deleteCard': 'Delete card',
    'retro.deleteConfirm': 'Are you sure you want to delete this card?',
    'retro.failedLoad': 'Failed to load the retrospective.',
    'retro.failedCreate': 'Failed to add the card.',
    'retro.failedUpdate': 'Failed to update the card.',
    'retro.failedDelete': 'Failed to delete the card.',
    'retro.failedVote': 'Failed to vote.',
    'retro.iterationNotStarted': 'The retrospective is only available for active or completed iterations.',

    // Quarter Plan
    'quarterPlan.title': 'Quarterly Plan',
    'quarterPlan.subtitle': 'Strategic overview of iterations and features.',
    'quarterPlan.recentPageLabel': 'Quarter Plan',
    'quarterPlan.quarterShort': 'Q',
    'quarterPlan.noIterationsTitle': 'No Iterations Found',
    'quarterPlan.noIterationsDescription': 'There are no planned iterations for the selected date range.',
    'quarterPlan.spanningFeatures': 'Spanning Features',
    'quarterPlan.todo': 'Todo',
    'quarterPlan.inProgress': 'In Prog',
    'quarterPlan.done': 'Done',
    'quarterPlan.spSuffix': 'SP',
    'quarterPlan.teamCapacity': 'Team Capacity:',
    'quarterPlan.daysSuffix': 'Days',
    'quarterPlan.noFeatures': 'No cross-iteration features found in this period.',
    'quarterPlan.statusPlanning': 'Planning',
    'quarterPlan.statusActive': 'Active',
    'quarterPlan.statusCompleted': 'Completed',

    // Language names
    'language.lt': 'Lithuanian',
    'language.en': 'English',
  },
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as string[]).includes(value as string);
}

export function translate(language: Language, key: TranslationKey): string {
  const dict = translations[language] ?? translations[DEFAULT_LANGUAGE];
  const value = dict[key];
  if (typeof value === 'string') return value;

  const fallback = translations[DEFAULT_LANGUAGE][key];
  if (typeof fallback === 'string') return fallback;

  return key;
}
