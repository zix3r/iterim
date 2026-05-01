namespace iterimApi.DTOs.Atpa;

/// <summary>
/// Warning or info message produced by the ATPA algorithm.
///
/// Localization contract: backend emits a stable <see cref="Code"/> (e.g.
/// <c>NO_TAG_MATCH</c>) plus parameters for interpolation in
/// <see cref="MessageParams"/>. Clients translate via i18n keyed on the code.
/// <see cref="Message"/> stays as a plain English fallback for clients that
/// don't translate (logs, alternate consumers).
/// </summary>
public class AtpaWarningDto
{
    /// <summary>
    /// "warning" or "info".
    /// </summary>
    public string Severity { get; set; } = "warning";

    /// <summary>Stable identifier — used as i18n key (e.g. <c>NO_TAG_MATCH</c>).</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Plain English fallback; not translated.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Interpolation parameters keyed by template placeholder, e.g.
    /// <c>{ "title": "Login bug", "sp": "5" }</c>. Frontend substitutes
    /// these into the localized template (e.g. <c>"„{title}" SP ({sp})…"</c>).
    /// </summary>
    public Dictionary<string, string> MessageParams { get; set; } = [];

    /// <summary>
    /// Optional related entity id (work item or member), depending on the message.
    /// </summary>
    public int? RelatedEntityId { get; set; }
}
