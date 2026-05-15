namespace iterimApi.Models.Enums;

/// <summary>
/// Multi-select reasons a user is dissatisfied. Stored as int (bitwise flags)
/// so a single feedback can carry multiple reasons.
/// </summary>
[Flags]
public enum FeedbackDissatisfactionReason
{
    None = 0,
    MissingFunctionality = 1 << 0,
    EasyToGetLost = 1 << 1,
    DifficultToStart = 1 << 2,
    MissingIntegration = 1 << 3,
    NotVisuallyAppealing = 1 << 4,
    NotUpToStandards = 1 << 5,
    TooExpensive = 1 << 6,
    Other = 1 << 7,
    UnmentionedFlaw = 1 << 8,
}