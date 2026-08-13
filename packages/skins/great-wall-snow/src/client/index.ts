import type { Context } from '@deepseek-ai/cordis'
import css from '../../../../../shared/great-wall/great-wall-base.module.css'
import { mountGreatWallSkin } from '../../../../../shared/great-wall/great-wall-runtime.ts'
import './snow.module.css'
import { DSH_RED_WHALE, GREAT_WALL_STAGE } from './art.generated.ts'

export function apply(ctx: Context): void {
  mountGreatWallSkin(ctx, {
    bodyAttribute: 'data-dsh-great-wall-snow',
    title: '夕小瑶 · 雪岭长城',
    lockup: '雪岭长城',
    subtitle: 'GREAT WALL / SNOW PASS',
    serial: '长城三境 · 03',
    stage: GREAT_WALL_STAGE,
    whale: DSH_RED_WHALE,
    scrim: 'linear-gradient(90deg, rgba(250,247,242,.7) 0%, rgba(248,245,241,.26) 57%, rgba(248,245,241,0) 100%)',
    focusScrim: 'linear-gradient(90deg, rgba(250,247,242,.96) 0%, rgba(248,245,241,.84) 62%, rgba(248,245,241,.5) 100%)',
    css,
  })
}
