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

  // Organizations
  | 'organizations.title'
  | 'organizations.create'
  | 'organizations.createTitle'
  | 'organizations.createDescription'
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

  // Products
  | 'products.title'
  | 'products.create'
  | 'products.createTitle'
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

  // Teams
  | 'teams.title'
  | 'teams.create'
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

  // Backlog
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
    'common.next': 'Toliau',
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

    // Header
    'header.themeToggle.toLight': 'Perjungti į šviesų režimą',
    'header.themeToggle.toDark': 'Perjungti į tamsų režimą',
    'header.themeToggle.srLabel': 'Perjungti temą',
    'header.languageToggle.title': 'Pakeisti kalbą',
    'header.languageToggle.srLabel': 'Perjungti kalbą',
    'header.adminPanel': 'Administratoriaus skydelis',
    'header.notifications': 'Pranešimai',
    'header.openMenu': 'Atidaryti meniu',
    'header.navigation': 'Navigacija',

    // Vartotojo meniu
    'user.profile': 'Profilis',
    'user.logout': 'Atsijungti',
    'user.fallbackName': 'Vartotojas',

    // Sidebar
    'sidebar.dashboard': 'Suvestinė',
    'sidebar.pinned': 'Įsegtos',
    'sidebar.myOrganizations': 'Mano organizacijos',
    'sidebar.recentPages': 'Naujausi puslapiai',
    'sidebar.logout': 'Atsijungti',
    'sidebar.editProfile': 'Redaguoti profilį',

    // Auth
    'auth.welcomeBack': 'Sveiki sugrįžę',
    'auth.signInSubtitle': 'Prisijunkite, kad galėtumėte tęsti darbą',
    'auth.signIn': 'Prisijungti',
    'auth.signingIn': 'Jungiamasi…',
    'auth.emailAddress': 'El. paštas',
    'auth.emailPlaceholder': 'jus@pavyzdys.lt',
    'auth.password': 'Slaptažodis',
    'auth.passwordPlaceholder': '••••••••',
    'auth.forgotPassword': 'Pamiršote slaptažodį?',
    'auth.passwordResetSuccess': 'Slaptažodis sėkmingai pakeistas. Dabar galite prisijungti.',
    'auth.emailNotConfirmed': 'El. paštas nepatvirtintas',
    'auth.emailNotConfirmedMessage': 'Prieš prisijungdami turite patvirtinti savo el. pašto adresą. Patikrinkite gautuosius.',
    'auth.resendConfirmation': 'Persiųsti patvirtinimo laišką',
    'auth.sending': 'Siunčiama…',
    'auth.confirmationLinkSent': 'Patvirtinimo nuoroda išsiųsta',
    'auth.failedToSend': 'Nepavyko išsiųsti. Pabandykite vėliau.',
    'auth.dontHaveAccount': 'Neturite paskyros?',
    'auth.createOne': 'Sukurti',
    'auth.showPassword': 'Rodyti slaptažodį',
    'auth.hidePassword': 'Slėpti slaptažodį',
    'auth.loginFailed': 'Prisijungti nepavyko.',
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
    'auth.pwdReqNumber': 'Skaitmuo',
    'auth.forgotTitle': 'Pamiršote slaptažodį?',
    'auth.forgotSubtitle': 'Įveskite savo el. paštą — atsiųsime nuorodą atstatymui.',
    'auth.sendResetLink': 'Siųsti atstatymo nuorodą',
    'auth.sendingResetLink': 'Siunčiama…',
    'auth.resetLinkSent': 'Jei toks el. paštas egzistuoja, atstatymo nuoroda buvo išsiųsta.',
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
    'auth.goToLogin': 'Pereiti prie prisijungimo',
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
    'dashboard.recentItems': 'Naujausi darbo elementai',
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

    // Organizations
    'organizations.title': 'Organizacijos',
    'organizations.create': 'Sukurti organizaciją',
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
    'organizations.pendingInvitations': 'Laukiantys pakvietimai',
    'organizations.noPendingInvitations': 'Laukiančių pakvietimų nėra.',
    'organizations.acceptInvitation': 'Priimti',
    'organizations.declineInvitation': 'Atmesti',
    'organizations.role': 'Rolė',
    'organizations.roleOwner': 'Savininkas',
    'organizations.roleAdmin': 'Administratorius',
    'organizations.roleMember': 'Narys',
    'organizations.invite': 'Pakviesti',
    'organizations.inviteSent': 'Pakvietimas išsiųstas',
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

    // Products
    'products.title': 'Produktai',
    'products.create': 'Sukurti produktą',
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
    'products.deleteConfirm': 'Ar tikrai norite ištrinti šį produktą?',
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

    // Teams
    'teams.title': 'Komandos',
    'teams.create': 'Sukurti komandą',
    'teams.createTitle': 'Sukurti naują komandą',
    'teams.editTitle': 'Redaguoti komandą',
    'teams.namePlaceholder': 'Komandos pavadinimas',
    'teams.descriptionPlaceholder': 'Komandos aprašymas',
    'teams.members': 'Nariai',
    'teams.lead': 'Komandos vadovas',
    'teams.capacity': 'Pajėgumas',
    'teams.capacityHours': 'Valandos per iteraciją',
    'teams.addMember': 'Pridėti narį',
    'teams.addMemberTitle': 'Pridėti komandos narį',
    'teams.removeMember': 'Pašalinti narį',
    'teams.removeMemberConfirm': 'Ar tikrai norite pašalinti šį narį iš komandos?',
    'teams.deleteConfirm': 'Ar tikrai norite ištrinti šią komandą?',
    'teams.noTeams': 'Komandų nėra.',
    'teams.createFirst': 'Sukurkite pirmąją komandą',
    'teams.failedLoad': 'Nepavyko įkelti komandų.',
    'teams.failedCreate': 'Nepavyko sukurti komandos.',
    'teams.failedUpdate': 'Nepavyko atnaujinti komandos.',
    'teams.failedDelete': 'Nepavyko ištrinti komandos.',
    'teams.role': 'Rolė',
    'teams.roleLead': 'Vadovas',
    'teams.roleMember': 'Narys',

    // Backlog
    'backlog.title': 'Darbų sąrašas',
    'backlog.addItem': 'Pridėti darbo elementą',
    'backlog.createItemTitle': 'Sukurti darbo elementą',
    'backlog.editItemTitle': 'Redaguoti darbo elementą',
    'backlog.itemTitle': 'Pavadinimas',
    'backlog.itemTitlePlaceholder': 'Trumpas darbo elemento pavadinimas',
    'backlog.itemDescription': 'Aprašymas',
    'backlog.itemDescriptionPlaceholder': 'Detalesnis aprašymas',
    'backlog.type': 'Tipas',
    'backlog.typeStory': 'Istorija',
    'backlog.typeBug': 'Klaida',
    'backlog.typeTask': 'Užduotis',
    'backlog.typeEpic': 'Epas',
    'backlog.priority': 'Prioritetas',
    'backlog.priorityLow': 'Žemas',
    'backlog.priorityMedium': 'Vidutinis',
    'backlog.priorityHigh': 'Aukštas',
    'backlog.priorityCritical': 'Kritinis',
    'backlog.status': 'Būsena',
    'backlog.statusNew': 'Naujas',
    'backlog.statusInProgress': 'Vykdomas',
    'backlog.statusReview': 'Peržiūra',
    'backlog.statusDone': 'Užbaigtas',
    'backlog.statusBlocked': 'Užblokuotas',
    'backlog.points': 'Balai',
    'backlog.assignee': 'Vykdytojas',
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
    'backlog.blockedBy': 'Blokuojamas',
    'backlog.relatesTo': 'Susijęs su',
    'backlog.duplicates': 'Dublikatas',
    'backlog.deleteItemConfirm': 'Ar tikrai norite ištrinti šį darbo elementą?',
    'backlog.failedLoad': 'Nepavyko įkelti darbų sąrašo.',
    'backlog.failedCreate': 'Nepavyko sukurti darbo elemento.',
    'backlog.failedUpdate': 'Nepavyko atnaujinti darbo elemento.',
    'backlog.failedDelete': 'Nepavyko ištrinti darbo elemento.',
    'backlog.completeConfirm': 'Ar tikrai norite užbaigti šią iteraciją?',
    'backlog.moveUnfinishedTo': 'Perkelti nebaigtus elementus į',
    'backlog.dependencyDetails': 'Priklausomybės informacija',
    'backlog.removeDependency': 'Pašalinti priklausomybę',

    // Board
    'board.title': 'Lenta',
    'board.todo': 'Reikia atlikti',
    'board.inProgress': 'Vykdoma',
    'board.review': 'Peržiūra',
    'board.done': 'Atlikta',
    'board.blocked': 'Užblokuota',
    'board.noItemsInColumn': 'Šiame stulpelyje elementų nėra.',
    'board.noActiveIteration': 'Aktyvių iteracijų nėra.',
    'board.selectIteration': 'Pasirinkite iteraciją',
    'board.dragHint': 'Tempkite korteles tarp stulpelių.',
    'board.blockerError': 'Negalima perkelti užblokuoto elemento',
    'board.blockerErrorMessage': 'Šis darbo elementas turi neišspręstų blokuojančių priklausomybių.',
    'board.cannotMoveBlocked': 'Negalima perkelti užblokuoto elemento.',
    'board.failedLoad': 'Nepavyko įkelti lentos.',
    'board.failedMove': 'Nepavyko perkelti elemento.',

    // Metrics
    'metrics.title': 'Metrikos',
    'metrics.velocity': 'Greitis',
    'metrics.velocityDescription': 'Vidutinis komandos greitis per iteraciją.',
    'metrics.burndown': 'Užbaigimo grafikas',
    'metrics.burndownDescription': 'Likę darbai per iteracijos eigą.',
    'metrics.burnup': 'Pridėjimo grafikas',
    'metrics.capacity': 'Pajėgumas',
    'metrics.capacityDescription': 'Komandos pajėgumas šiai iteracijai.',
    'metrics.sprintProgress': 'Iteracijos eiga',
    'metrics.sprintProgressDescription': 'Aktualios iteracijos pažanga.',
    'metrics.throughput': 'Pralaidumas',
    'metrics.cycleTime': 'Ciklo laikas',
    'metrics.leadTime': 'Įgyvendinimo laikas',
    'metrics.completed': 'Užbaigta',
    'metrics.remaining': 'Liko',
    'metrics.committed': 'Įsipareigota',
    'metrics.dateRange': 'Datų intervalas',
    'metrics.lastNSprints': 'Paskutinės iteracijos',
    'metrics.points': 'Balai',
    'metrics.day': 'Diena',
    'metrics.ideal': 'Idealu',
    'metrics.actual': 'Faktiškai',
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
    'absences.failedDelete': 'Nepavyko ištrinti pravaikštos.',

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
    'profile.deleteAccountConfirm': 'Ar tikrai norite ištrinti savo paskyrą? Šis veiksmas yra negrįžtamas.',

    // Admin
    'admin.usersTitle': 'Vartotojų valdymas',
    'admin.systemTitle': 'Sistemos informacija',
    'admin.sidebarUsers': 'Vartotojai',
    'admin.sidebarSystem': 'Sistema',
    'admin.allUsers': 'Visi vartotojai',
    'admin.addUser': 'Pridėti vartotoją',
    'admin.editUser': 'Redaguoti vartotoją',
    'admin.deleteUser': 'Ištrinti vartotoją',
    'admin.deleteUserConfirm': 'Ar tikrai norite ištrinti šį vartotoją?',
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

    // Layout
    'layout.breadcrumbHome': 'Pradžia',
    'layout.breadcrumbOrganizations': 'Organizacijos',
    'layout.breadcrumbProducts': 'Produktai',
    'layout.breadcrumbTeams': 'Komandos',
    'layout.breadcrumbBacklog': 'Darbų sąrašas',
    'layout.breadcrumbBoard': 'Lenta',
    'layout.breadcrumbMetrics': 'Metrikos',
    'layout.breadcrumbAbsences': 'Pravaikštos',
    'layout.breadcrumbAdmin': 'Administravimas',

    // Shared
    'shared.tagAdd': 'Pridėti žymą',
    'shared.tagRemove': 'Pašalinti žymą',
    'shared.workItem': 'Darbo elementas',
    'shared.errorTitle': 'Įvyko klaida',
    'shared.errorMessage': 'Atsiprašome, įvyko netikėta klaida.',
    'shared.errorRefresh': 'Atnaujinti puslapį',
    'shared.errorContact': 'Jei klaida kartojasi, susisiekite su pagalba.',
    'shared.confirmTitle': 'Patvirtinkite veiksmą',
    'shared.confirmMessage': 'Ar tikrai norite tęsti?',

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

    // Organizations
    'organizations.title': 'Organizations',
    'organizations.create': 'Create organization',
    'organizations.createTitle': 'Create new organization',
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

    // Products
    'products.title': 'Products',
    'products.create': 'Create product',
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

    // Teams
    'teams.title': 'Teams',
    'teams.create': 'Create team',
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

    // Backlog
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
    'admin.usersTitle': 'User Management',
    'admin.systemTitle': 'System Information',
    'admin.sidebarUsers': 'Users',
    'admin.sidebarSystem': 'System',
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

    // Language names
    'language.lt': 'Lithuanian',
    'language.en': 'English',
  },
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as string[]).includes(value);
}

export function translate(language: Language, key: TranslationKey): string {
  const dict = translations[language] ?? translations[DEFAULT_LANGUAGE];
  const value = dict[key];
  if (typeof value === 'string') return value;

  const fallback = translations[DEFAULT_LANGUAGE][key];
  if (typeof fallback === 'string') return fallback;

  return key;
}
