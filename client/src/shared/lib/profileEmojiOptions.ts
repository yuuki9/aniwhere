const TOSS_EMOJI_BASE_URL = 'https://static.toss.im/2d-emojis/png/4x'

export const PROFILE_EMOJI_INTRO_COUNT = 10
export const PROFILE_EMOJI_PAGE_SIZE = 10
export const PROFILE_EMOJI_PAGE_COUNT = 4

export type ProfileEmojiOption = {
  id: string
  label: string
  emojiIconFilename: string
  symbol: string
  tone: string
  src: string
}

const profileEmojiOptionSeed = [
  ['penguin', '펭귄', 'u1F427.png', '#bfe3ff'],
  ['sunglasses', '선글라스', 'u1F60E.png', '#fff0b8'],
  ['panda', '판다', 'u1F43C.png', '#dff4df'],
  ['fire', '불꽃', 'u1F525.png', '#d8ebff'],
  ['fox', '여우', 'u1F98A.png', '#ffd4dc'],
  ['koala', '코알라', 'u1F428.png', '#dce8f2'],
  ['robot', '로봇', 'u1F916.png', '#dce4ef'],
  ['chick', '병아리', 'u1F425.png', '#fff0b8'],
  ['alien', '외계인', 'u1F47D.png', '#eadcff'],
  ['cat', '고양이', 'u1F431.png', '#ffe1e8'],
  ['dog', '강아지', 'u1F436.png', '#e5efff'],
  ['bear', '곰', 'u1F43B.png', '#ffe2c2'],
  ['unicorn', '유니콘', 'u1F984.png', '#eadfff'],
  ['rabbit', '토끼', 'u1F430.png', '#ffe2f0'],
  ['lion', '사자', 'u1F981.png', '#ffe0ae'],
  ['tiger', '호랑이', 'u1F42F.png', '#ffd1aa'],
  ['monkey', '원숭이', 'u1F435.png', '#f4ddc4'],
  ['frog', '개구리', 'u1F438.png', '#d8f5d0'],
  ['octopus', '문어', 'u1F419.png', '#ffd4eb'],
  ['whale', '고래', 'u1F433.png', '#cfe9ff'],
  ['smile', '웃음', 'u1F600.png', '#fff0b8'],
  ['grin', '활짝 웃음', 'u1F603.png', '#fff0b8'],
  ['happy', '기쁨', 'u1F604.png', '#fff0b8'],
  ['heart-eyes', '하트눈', 'u1F60D.png', '#ffd6df'],
  ['star-eyes', '별눈', 'u1F929.png', '#ffeec2'],
  ['wink', '윙크', 'u1F609.png', '#fff0b8'],
  ['party', '파티', 'u1F973.png', '#dce8ff'],
  ['thinking', '생각', 'u1F914.png', '#fff0b8'],
  ['sleepy', '졸림', 'u1F634.png', '#dce8ff'],
  ['hug', '포옹', 'u1F917.png', '#fff0b8'],
  ['star', '별', 'u2B50.png', '#fff4bf'],
  ['purple-heart', '보라 하트', 'u1F49C.png', '#eadfff'],
  ['rocket', '로켓', 'u1F680.png', '#e6f0ff'],
  ['sparkles', '반짝임', 'u2728.png', '#fff4bf'],
  ['game', '게임 패드', 'u1F3AE.png', '#eadfff'],
  ['camera', '카메라', 'u1F4F7.png', '#e9eef5'],
  ['books', '책', 'u1F4DA.png', '#dff4df'],
  ['coffee', '커피', 'u2615.png', '#f2dfcf'],
  ['gift', '선물', 'u1F381.png', '#ffdbe6'],
  ['gem', '보석', 'u1F48E.png', '#d8f2ff'],
  ['headphones', '헤드폰', 'u1F3A7.png', '#e6e9ff'],
  ['dice', '주사위', 'u1F3B2.png', '#ffe2ea'],
  ['target', '과녁', 'u1F3AF.png', '#ffd9d9'],
  ['dizzy', '어지러움', 'u1F4AB.png', '#e8e0ff'],
  ['rainbow', '무지개', 'u1F308.png', '#e4edff'],
  ['cloud', '구름', 'u2601.png', '#e8eef5'],
  ['zap', '번개', 'u26A1.png', '#fff0b8'],
  ['bulb', '전구', 'u1F4A1.png', '#fff0b8'],
  ['art', '팔레트', 'u1F3A8.png', '#ffe0ec'],
  ['movie', '영화', 'u1F3AC.png', '#e8eef5'],
  ['sushi', '스시', 'u1F363.png', '#ffe0df'],
  ['ramen', '라멘', 'u1F35C.png', '#ffe4c7'],
  ['icecream', '아이스크림', 'u1F366.png', '#dff0ff'],
  ['candy', '사탕', 'u1F36D.png', '#ffdbea'],
  ['popcorn', '팝콘', 'u1F37F.png', '#fff0b8'],
  ['moon', '달', 'u1F319.png', '#dde6ff'],
  ['sun', '해', 'u2600.png', '#ffeab0'],
  ['snowflake', '눈송이', 'u2744.png', '#d8f2ff'],
  ['clover', '클로버', 'u1F340.png', '#d8f5d0'],
  ['cherry-blossom', '벚꽃', 'u1F338.png', '#ffdceb'],
] as const

export const PROFILE_EMOJI_OPTIONS: readonly ProfileEmojiOption[] = profileEmojiOptionSeed.map(
  ([id, label, emojiIconFilename, tone]) => ({
    id,
    label,
    emojiIconFilename,
    symbol: emojiFromFilename(emojiIconFilename) ?? '',
    tone,
    src: profileEmojiUrl(emojiIconFilename) ?? '',
  }),
)

export function profileEmojiUrl(filename: string | null | undefined) {
  if (filename == null || !/^u[0-9a-f]{4,6}\.png$/i.test(filename)) {
    return null
  }

  return `${TOSS_EMOJI_BASE_URL}/${filename}`
}

export function emojiFromFilename(filename: string | null | undefined) {
  const match = filename?.match(/^u([0-9a-f]{4,6})\.png$/i)
  if (match == null) {
    return null
  }

  const codePoint = Number.parseInt(match[1], 16)
  if (Number.isNaN(codePoint)) {
    return null
  }

  return String.fromCodePoint(codePoint)
}

export function getProfileEmojiOption(id: string | null | undefined) {
  return PROFILE_EMOJI_OPTIONS.find((option) => option.id === id) ?? PROFILE_EMOJI_OPTIONS[0]
}

export function getProfileEmojiSymbol(emojiIconFilename: string | null | undefined) {
  return PROFILE_EMOJI_OPTIONS.find((option) => option.emojiIconFilename === emojiIconFilename)?.symbol
}

function getProfileEmojiOptionByFilename(emojiIconFilename: string | null | undefined) {
  if (emojiIconFilename == null) {
    return null
  }

  const option = PROFILE_EMOJI_OPTIONS.find((item) => item.emojiIconFilename === emojiIconFilename)
  if (option != null) {
    return option
  }

  const src = profileEmojiUrl(emojiIconFilename)
  const symbol = emojiFromFilename(emojiIconFilename)
  if (src == null || symbol == null) {
    return null
  }

  return {
    id: `custom-${emojiIconFilename.replace(/[^a-z0-9]/gi, '-')}`,
    label: '현재 프로필',
    emojiIconFilename,
    symbol,
    tone: '#d8ebff',
    src,
  } satisfies ProfileEmojiOption
}

function shuffledProfileEmojiOptions(excludeFilenames: readonly string[] = []) {
  const excluded = new Set(excludeFilenames)
  return PROFILE_EMOJI_OPTIONS
    .filter((option) => !excluded.has(option.emojiIconFilename))
    .map((option) => ({ option, weight: Math.random() }))
    .sort((left, right) => left.weight - right.weight)
    .map(({ option }) => option)
}

export function createRandomProfileEmojiSet(count = PROFILE_EMOJI_INTRO_COUNT) {
  return shuffledProfileEmojiOptions().slice(0, count)
}

export function createProfileEmojiPage({
  excludeFilenames = [],
  leadingFilename,
}: {
  excludeFilenames?: readonly string[]
  leadingFilename?: string | null
}) {
  const leadingOption = getProfileEmojiOptionByFilename(leadingFilename)
  const leadingFilenames = leadingOption == null ? [] : [leadingOption.emojiIconFilename]
  const randomOptions = shuffledProfileEmojiOptions([...excludeFilenames, ...leadingFilenames]).slice(
    0,
    PROFILE_EMOJI_PAGE_SIZE - leadingFilenames.length,
  )

  return leadingOption == null ? randomOptions : [leadingOption, ...randomOptions]
}
