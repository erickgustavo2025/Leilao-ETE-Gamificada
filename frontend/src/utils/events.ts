// Custom event dispatchers to avoid Fast Refresh issues and code duplication.

/**
 * Dispatches a 'openTradeModal' event to be caught by listeners (mostly in App.tsx or DashboardHome).
 * @param detail - Detail to pass to the event, like tradeId or targetUser.
 */
export const openTradeEvent = (detail: string | { targetUser: any }) => {
    const event = new CustomEvent('openTradeModal', { 
        detail: typeof detail === 'string' ? { tradeId: detail } : detail 
    });
    window.dispatchEvent(event);
};

/**
 * Dispatches a 'openTransferModal' event.
 * @param matricula - User's matricula to pre-fill the transfer modal.
 */
export const openTransferEvent = (matricula: string) => {
    const event = new CustomEvent('openTransferModal', { detail: { matricula } });
    window.dispatchEvent(event);
};

/**
 * Dispatches a 'setTransferMatricula' event.
 * @param matricula - User's matricula to set in the transfer modal.
 */
export const setTransferMatriculaEvent = (matricula: string) => {
    const event = new CustomEvent('setTransferMatricula', { detail: matricula });
    window.dispatchEvent(event);
};
