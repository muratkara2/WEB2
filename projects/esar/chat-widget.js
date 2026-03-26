(function () {
    const STORAGE_KEY = 'esarChatMessages';
    const LAST_READ_KEY = 'esarChatLastRead';
    const subscribers = [];

    function loadMessages() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return [];
            }
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('ESAR chat verileri okunamadı:', error);
            return [];
        }
    }

    function saveMessages(messages) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch (error) {
            console.warn('ESAR chat verileri kaydedilemedi:', error);
        }
    }

    function publish() {
        const snapshot = loadMessages();
        subscribers.forEach((listener) => listener(snapshot));
    }

    function subscribe(listener) {
        subscribers.push(listener);
        listener(loadMessages());
    }

    function addMessage(sender, text) {
        const cleanText = (text || '').trim();
        if (!cleanText) {
            return;
        }
        const messages = loadMessages();
        messages.push({
            id: Date.now(),
            sender,
            text: cleanText,
            timestamp: new Date().toISOString(),
        });
        saveMessages(messages);
        publish();
    }

    function clearMessages() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LAST_READ_KEY);
        publish();
    }

    function getLastReadTimestamp() {
        return localStorage.getItem(LAST_READ_KEY);
    }

    function setLastReadTimestamp(timestamp) {
        if (timestamp) {
            localStorage.setItem(LAST_READ_KEY, timestamp);
        } else {
            localStorage.removeItem(LAST_READ_KEY);
        }
    }

    function getLatestTimestamp(messages) {
        if (!messages.length) {
            return null;
        }
        return messages[messages.length - 1].timestamp;
    }

    function updateLauncherBadge(messages, isOpen) {
        const toggleButton = document.querySelector('[data-chat-toggle]');
        if (!toggleButton) {
            return;
        }
        const lastRead = getLastReadTimestamp();
        const hasUnread = messages.some(
            (message) => message.sender === 'agent' && (!lastRead || message.timestamp > lastRead)
        );
        toggleButton.classList.toggle('has-unread', hasUnread && !isOpen);
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatTime(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '';
        }
    }

    function formatFull(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            return '-';
        }
    }

    function renderChatMessages(container, messages) {
        if (!container) {
            return;
        }
        if (!messages.length) {
            container.innerHTML = '<p class="chat-empty">Henüz mesaj yok.</p>';
            return;
        }
        container.innerHTML = messages
            .map((message) => {
                const roleClass = message.sender === 'agent' ? 'is-agent' : 'is-user';
                return (
                    '<div class="chat-bubble ' + roleClass + '">' +
                    '<div>' + escapeHtml(message.text) + '</div>' +
                    '<span class="chat-meta">' + formatTime(message.timestamp) + '</span>' +
                    '</div>'
                );
            })
            .join('');
        container.scrollTop = container.scrollHeight;
    }

    function renderPanelMessages(container, messages) {
        if (!container) {
            return;
        }
        if (!messages.length) {
            container.innerHTML = '<p class="panel-empty">Henüz mesaj gelmedi.</p>';
            return;
        }
        container.innerHTML = messages
            .map((message) => {
                const roleLabel = message.sender === 'agent' ? 'Destek' : 'Kullanıcı';
                const roleClass = message.sender === 'agent' ? 'is-agent' : 'is-user';
                return (
                    '<article class="panel-message">' +
                    '<div class="chat-bubble ' + roleClass + '">' +
                    '<div><strong>' + roleLabel + ':</strong> ' + escapeHtml(message.text) + '</div>' +
                    '<span class="chat-meta">' + formatFull(message.timestamp) + '</span>' +
                    '</div>' +
                    '</article>'
                );
            })
            .join('');
        container.scrollTop = container.scrollHeight;
    }

    function initChatWidget() {
        const widget = document.querySelector('[data-chat-widget]');
        const toggleButton = document.querySelector('[data-chat-toggle]');
        if (!widget || !toggleButton) {
            return;
        }
        const closeButton = widget.querySelector('[data-chat-close]');
        const form = widget.querySelector('[data-chat-form]');
        const input = widget.querySelector('[data-chat-input]');
        const messageContainer = widget.querySelector('[data-chat-messages]');

        let widgetOpen = false;
        let latestMessages = [];

        const setOpenState = (shouldOpen) => {
            widgetOpen = shouldOpen;
            widget.classList.toggle('is-open', shouldOpen);
            toggleButton.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
            if (shouldOpen) {
                const latestTimestamp = getLatestTimestamp(latestMessages);
                if (latestTimestamp) {
                    setLastReadTimestamp(latestTimestamp);
                }
            }
            updateLauncherBadge(latestMessages, widgetOpen);
        };

        toggleButton.addEventListener('click', () => {
            const nextState = !widget.classList.contains('is-open');
            setOpenState(nextState);
            if (nextState && input) {
                input.focus();
            }
        });

        if (closeButton) {
            closeButton.addEventListener('click', () => setOpenState(false));
        }

        if (form && input) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                addMessage('user', input.value);
                input.value = '';
                input.focus();
            });
        }

        subscribe((messages) => {
            latestMessages = messages;
            renderChatMessages(messageContainer, messages);
            if (widgetOpen) {
                const latestTimestamp = getLatestTimestamp(messages);
                if (latestTimestamp) {
                    setLastReadTimestamp(latestTimestamp);
                }
            }
            updateLauncherBadge(messages, widgetOpen);
        });
    }

    function initSupportPanel() {
        const panel = document.querySelector('[data-support-panel]');
        if (!panel) {
            return;
        }
        const list = panel.querySelector('[data-support-messages]');
        const form = panel.querySelector('[data-support-form]');
        const input = panel.querySelector('[data-support-input]');
        const clearButton = panel.querySelector('[data-support-clear]');
        const quickReplyButtons = panel.querySelectorAll('[data-quick-reply]');
        const countEl = panel.querySelector('[data-support-count]');
        const lastEl = panel.querySelector('[data-support-last]');

        subscribe((messages) => {
            renderPanelMessages(list, messages);
            if (countEl) {
                countEl.textContent = String(messages.length);
            }
            if (lastEl) {
                lastEl.textContent = messages.length ? formatFull(messages[messages.length - 1].timestamp) : '-';
            }
        });

        if (form && input) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                addMessage('agent', input.value);
                input.value = '';
                input.focus();
            });
        }

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (confirm('Tüm konuşmayı temizlemek istediğinize emin misiniz?')) {
                    clearMessages();
                }
            });
        }

        quickReplyButtons.forEach((button) => {
            button.addEventListener('click', () => {
                if (!input) {
                    return;
                }
                input.value = button.getAttribute('data-quick-reply') || '';
                input.focus();
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initChatWidget();
        initSupportPanel();
        publish();
    });

    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY || event.key === LAST_READ_KEY) {
            publish();
        }
    });
})();
