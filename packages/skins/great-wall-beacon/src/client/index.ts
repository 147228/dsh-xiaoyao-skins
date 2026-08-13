import type { Context } from '@deepseek-ai/cordis'
import css from '../../../../../shared/great-wall/great-wall-base.module.css'
import { mountGreatWallSkin } from '../../../../../shared/great-wall/great-wall-runtime.ts'
import './beacon.module.css'
import { DSH_RED_WHALE, GREAT_WALL_STAGE } from './art.generated.ts'

export function apply(ctx: Context): void {
  mountGreatWallSkin(ctx, {
    bodyAttribute: 'data-dsh-great-wall-beacon',
    title: '夕小瑶 · 烽火夜长城',
    lockup: '烽火夜长城',
    subtitle: 'GREAT WALL / BEACON NIGHT',
    serial: '长城三境 · 01',
    stage: GREAT_WALL_STAGE,
    whale: DSH_RED_WHALE,
    scrim: 'linear-gradient(90deg, rgba(3,3,4,.62) 0%, rgba(6,6,8,.24) 54%, rgba(7,5,5,0) 100%)',
    focusScrim: 'linear-gradient(90deg, rgba(3,3,4,.94) 0%, rgba(7,7,9,.78) 60%, rgba(8,5,5,.48) 100%)',
    css,
  })
}
