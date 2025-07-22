import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import * as middleware from 'i18next-http-middleware'
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'vi',
    preload: ['vi', 'ja'],
    ns: ['translation', 'user', 'auth', 'customer', 'pm', 'project', 'phase', 'document', 'feedback'],
    defaultNS: 'translation',
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    },
    detection: {
      order: ['path'],
      lookupFromPathIndex: 1
    },
  });

export default i18next;