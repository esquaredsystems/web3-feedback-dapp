// Single source of truth for the feedback form.
// Rating items are flattened in order into a uint8[30] array stored on-chain —
// keep this order in sync with the comment in contracts/WorkshopFeedback.sol.

export const QUALITY_SCALE = ['Poor', 'Fair', 'Satisfactory', 'Good', 'Excellent'] as const
export const AGREEMENT_SCALE = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] as const

export type Scale = readonly string[]

export interface RatingSection {
  id: string
  number: number
  title: string
  subtitle?: string
  scale: Scale
  items: string[]
}

export const RATING_SECTIONS: RatingSection[] = [
  {
    id: 'effort',
    number: 3,
    title: 'Instructor effort',
    scale: QUALITY_SCALE,
    items: ['Level of effort being put by the instructor'],
  },
  {
    id: 'experience',
    number: 4,
    title: 'Learning experience',
    scale: QUALITY_SCALE,
    items: ['Your learning experience so far'],
  },
  {
    id: 'discipline',
    number: 5,
    title: 'Discipline',
    scale: QUALITY_SCALE,
    items: [
      'Time management',
      'Workshop planning',
      'Prompt rectification of issues',
      'Class decorum',
      'Distribution between theory and hands-on',
    ],
  },
  {
    id: 'teaching',
    number: 6,
    title: 'Teaching skill',
    scale: QUALITY_SCALE,
    items: [
      'Authority on subject',
      'Effectiveness of teaching methods',
      'Use of right teaching tools and techniques',
      'Presentation organization',
      'Content clarity',
      'Teaching enthusiasm',
      'Practicality of examples',
    ],
  },
  {
    id: 'communication',
    number: 7,
    title: 'Communication',
    subtitle: 'How much do you agree with each statement?',
    scale: AGREEMENT_SCALE,
    items: [
      'Learning objectives are clear',
      'Contents, expectations and rules are communicated',
      'Instructor is easily approachable',
      'Instructor responds promptly',
      'Questions are answered satisfactorily',
      'Language used is easy to understand',
      'Instructor is aware of your cognitive and emotional needs',
      'Instructor talks respectfully',
      'Audio/Visual aids were used where necessary',
      'WhatsApp is a good medium for this workshop/course',
    ],
  },
  {
    id: 'outcomes',
    number: 8,
    title: 'Outcomes',
    scale: QUALITY_SCALE,
    items: [
      'Contribution in strengthening theoretical concepts',
      'Contribution in strengthening practical skills',
      'Learning, in comparison to other workshops/courses you attended',
      'Value for time, money and effort',
      'Alignment with the industry trends',
      'Workshop/course achievements versus the goals',
    ],
  },
]

/** Offset of each section's first item within the flat ratings array. */
export const SECTION_OFFSETS: number[] = RATING_SECTIONS.reduce<number[]>((acc, _s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + RATING_SECTIONS[i - 1].items.length)
  return acc
}, [])

export const RATING_COUNT = RATING_SECTIONS.reduce((n, s) => n + s.items.length, 0) // 30

// Enum orders must match the Solidity enums.
export const REASON_OPTIONS = ['Official requirement', 'Fits my schedule', 'Personal interest'] as const
export const RECOMMEND_OPTIONS = ['Yes', 'No', 'Maybe'] as const
export const WOULD_PAY_OPTIONS = ['Yes', 'No'] as const

export const MAX_NAME_BYTES = 64
export const MAX_TEXT_BYTES = 1000

/** Fallback when the contract isn't reachable yet. */
export const DEFAULT_COURSES = [{ name: 'Blockchain and DeFi', active: true }]
