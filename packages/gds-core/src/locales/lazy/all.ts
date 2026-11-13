/**
 * Registers every locale through the lazy registry in one import — the lazy-registry
 * equivalent of today's default all-twelve behavior, for a consumer that wants the registry's
 * dev-warning coverage without yet trimming which locales it ships.
 *
 * Registers the dictionaries directly rather than importing the per-locale entries, so each
 * entry's registration stays in its own bundle file instead of a chunk shared with this one.
 */
import { registerGdsLocale } from './registry';
import { es } from '../es';
import { hu } from '../hu';
import { de } from '../de';
import { fr } from '../fr';
import { it } from '../it';
import { ru } from '../ru';
import { he } from '../he';
import { ar } from '../ar';
import { zh } from '../zh';
import { ja } from '../ja';
import { ko } from '../ko';

registerGdsLocale('es', es);
registerGdsLocale('hu', hu);
registerGdsLocale('de', de);
registerGdsLocale('fr', fr);
registerGdsLocale('it', it);
registerGdsLocale('ru', ru);
registerGdsLocale('he', he);
registerGdsLocale('ar', ar);
registerGdsLocale('zh', zh);
registerGdsLocale('ja', ja);
registerGdsLocale('ko', ko);
