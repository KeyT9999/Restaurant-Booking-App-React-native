# BookEat Mobile Design Context

The app uses a dark, premium visual language with restrained amber accents. Existing tokens in `src/theme/tokens.ts` are the source of truth: near-black background `#0C0F16`, dark cards `#141720`, elevated surfaces `#1B2030`, amber primary `#D49653`, white primary text, muted secondary text, emerald success, rose error, and subtle translucent borders.

Use the existing typography and spacing system. Display headings may use the established serif face; controls and transactional data use the system sans face. Maintain at least 44px touch targets, readable contrast, concise Vietnamese labels, and clear pressed/disabled/loading states.

Cards should group related information without excessive nesting. Financial summaries place the most important result—refund, fee, wallet balance, or amount payable—at the strongest visual level. Use semantic success/error color as reinforcement, never as the only carrier of meaning.

Cancellation screens must present policy, deposit, fee, refund, destination, reason, and acknowledgement before confirmation. Wallet screens show available balance first, followed by chronological transaction history and useful links back to the related booking. Empty, loading, offline, and retry states must be deliberate and compact.
