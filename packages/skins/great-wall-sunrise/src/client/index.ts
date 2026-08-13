import type { Context } from '@deepseek-ai/cordis'
import css from '../../../../../shared/great-wall/great-wall-base.module.css'
import { mountGreatWallSkin } from '../../../../../shared/great-wall/great-wall-runtime.ts'
import './sunrise.module.css'
import { DSH_RED_WHALE, GREAT_WALL_STAGE } from './art.generated.ts'

export function apply(ctx: Context): void {
  mountGreatWallSkin(ctx, {
    bodyAttribute: 'data-dsh-great-wall-sunrise',
    title: '夕小瑶 · 山河朝霞',
    lockup: '山河朝霞',
    subtitle: 'GREAT WALL / MORNING GLOW',
    serial: '长城三境 · 02',
    stage: GREAT_WALL_STAGE,
    whale: DSH_RED_WHALE,
    scrim: 'linear-gradient(90deg, rgba(255,250,243,.72) 0%, rgba(255,248,238,.28) 57%, rgba(255,248,238,0) 100%)',
    focusScrim: 'linear-gradient(90deg, rgba(255,250,243,.95) 0%, rgba(255,248,238,.82) 62%, rgba(255,248,238,.48) 100%)',
    css,
  })
}
