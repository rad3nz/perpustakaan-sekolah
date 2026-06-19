import { createTheme, type MantineColorsTuple } from '@mantine/core'

const brand: MantineColorsTuple = [
  '#fce9ea',
  '#f5bcc0',
  '#ec9aa1',
  '#e0727b',
  '#d24e58',
  '#a82832',
  '#781118', // index 6 = canonical maroon
  '#701016',
  '#560c11',
  '#2d0609',
]

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  colors: { brand },
  black: '#0a2434', // navy base as the "black" for text
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
})
