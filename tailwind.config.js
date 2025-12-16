const path = require('path');
const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');
const generatePalette = require(path.resolve(__dirname, ('src/@youpez/tailwind/utils/generate-palette')));

/**
 * Custom palettes
 *
 * Uses the generatePalette helper method to generate
 * Tailwind-like color palettes automatically
 */
const customPalettes = {
    brand: generatePalette('#2196F3')
};

/**
 * Themes
 */
const themes = {
    // Default theme is required for theming system to work correctly!
    'default': {
        primary  : {
            ...colors.indigo,
            DEFAULT: colors.green[800]
        },
        accent   : {
            ...colors.slate,
            DEFAULT: colors.slate[800]
        },
        warn     : {
            ...colors.red,
            DEFAULT: colors.red[600]
        },
        'on-warn': {
            500: colors.red['50']
        }
    },
    // Rest of the themes will use the 'default' as the base
    // theme and will extend it with their given configuration.

    'brand' : {
        primary: customPalettes.brand
    },
    'teal'  : {
        primary: {
            ...colors.teal,
            DEFAULT: colors.teal[600]
        }
    },
    'rose'  : {
        primary: colors.rose
    },
    'purple': {
        primary: {
            ...colors.purple,
            DEFAULT: colors.purple[600]
        }
    },
    'amber' : {
        primary: colors.amber
    }
};

/**
 * Tailwind configuration
 */
const config = {
    darkMode   : 'class',
    content    : [
        './src/**/*.{html,css,scss,ts}',
        "./node_modules/tw-elements/dist/js/**/*.js",
        "./node_modules/flowbite/**/*.js"
    ],
    important  : true,
    theme      : {
        fontSize: {
            'xs'  : '0.625rem',
            'sm'  : '0.75rem',
            'md'  : '0.8125rem',
            'base': '0.875rem',
            'lg'  : '1rem',
            'xl'  : '1.125rem',
            '2xl' : '1.25rem',
            '3xl' : '1.5rem',
            '4xl' : '2rem',
            '5xl' : '2.25rem',
            '6xl' : '2.5rem',
            '7xl' : '3rem',
            '8xl' : '4rem',
            '9xl' : '6rem',
            '10xl': '8rem'
        },
        screens : {
            sm: '600px',
            md: '960px',
            lg: '1280px',
            xl: '1440px'
        },
        extend  : {
            animation               : {
                'spin-slow': 'spin 3s linear infinite',
                bounce: 'bounce 1s infinite',
                spin: 'spin 1s linear infinite',
            },
            keyframes: {
                // Définir des keyframes personnalisés
                bounce: {
                  '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
                  '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
                },
              },
            colors                  : {
                gray: colors.slate,
                primary: {
                    DEFAULT: '#BB890B',
                    50: '#FFF7F2',
                    100: '#FFEFD9',
                    200: '#FFD9A6',
                    300: '#FFC373',
                    400: '#FFAD40',
                    500: '#D4A00D',
                    600: '#BB890B',
                    700: '#9A7309',
                    800: '#7A5C07',
                    900: '#5A4505'
                }
            },
            flex                    : {
                '0': '0 0 auto'
            },
            fontFamily              : {
                sans: `"Inter var", ${defaultTheme.fontFamily.sans.join(',')}`,
                mono: `"IBM Plex Mono", ${defaultTheme.fontFamily.mono.join(',')}`
            },
            opacity                 : {
                12: '0.12',
                38: '0.38',
                87: '0.87'
            },
            rotate                  : {
                '-270': '270deg',
                '15'  : '15deg',
                '30'  : '30deg',
                '60'  : '60deg',
                '270' : '270deg'
            },
            scale                   : {
                '-1': '-1'
            },
            zIndex                  : {
                '-1'   : -1,
                '49'   : 49,
                '60'   : 60,
                '70'   : 70,
                '80'   : 80,
                '90'   : 90,
                '99'   : 99,
                '999'  : 999,
                '9999' : 9999,
                '99999': 99999
            },
            spacing                 : {
                '13': '3.25rem',
                '15': '3.75rem',
                '18': '4.5rem',
                '22': '5.5rem',
                '26': '6.5rem',
                '30': '7.5rem',
                '50': '12.5rem',
                '90': '22.5rem',

                // Bigger values
                '100': '25rem',
                '120': '30rem',
                '128': '32rem',
                '140': '35rem',
                '160': '40rem',
                '180': '45rem',
                '192': '48rem',
                '200': '50rem',
                '240': '60rem',
                '256': '64rem',
                '280': '70rem',
                '320': '80rem',
                '360': '90rem',
                '400': '100rem',
                '480': '120rem',

                // Fractional values
                '1/2': '50%',
                '1/3': '33.333333%',
                '2/3': '66.666667%',
                '1/4': '25%',
                '2/4': '50%',
                '3/4': '75%'
            },
            minHeight               : ({theme}) => ({
                ...theme('spacing')
            }),
            maxHeight               : {
                none: 'none'
            },
            minWidth                : ({theme}) => ({
                ...theme('spacing'),
                screen: '100vw'
            }),
            maxWidth                : ({theme}) => ({
                ...theme('spacing'),
                screen: '100vw'
            }),
            transitionDuration      : {
                '400': '400ms'
            },
            transitionTimingFunction: {
                'drawer': 'cubic-bezier(0.25, 0.8, 0.25, 1)'
            },
            // @tailwindcss/typography
            typography: ({theme}) => ({
                DEFAULT: {
                    css: {
                        color              : 'var(--youpez-text-default)',
                        '[class~="lead"]'  : {
                            color: 'var(--youpez-text-secondary)'
                        },
                        a                  : {
                            color: 'var(--youpez-primary-500)'
                        },
                        strong             : {
                            color: 'var(--youpez-text-default)'
                        },
                        'ol > li::before'  : {
                            color: 'var(--youpez-text-secondary)'
                        },
                        'ul > li::before'  : {
                            backgroundColor: 'var(--youpez-text-hint)'
                        },
                        hr                 : {
                            borderColor: 'var(--youpez-border)'
                        },
                        blockquote         : {
                            color          : 'var(--youpez-text-default)',
                            borderLeftColor: 'var(--youpez-border)'
                        },
                        h1                 : {
                            color: 'var(--youpez-text-default)'
                        },
                        h2                 : {
                            color: 'var(--youpez-text-default)'
                        },
                        h3                 : {
                            color: 'var(--youpez-text-default)'
                        },
                        h4                 : {
                            color: 'var(--youpez-text-default)'
                        },
                        'figure figcaption': {
                            color: 'var(--youpez-text-secondary)'
                        },
                        code               : {
                            color     : 'var(--youpez-text-default)',
                            fontWeight: '500'
                        },
                        'a code'           : {
                            color: 'var(--youpez-primary)'
                        },
                        pre                : {
                            color          : theme('colors.white'),
                            backgroundColor: theme('colors.gray.800')
                        },
                        thead              : {
                            color            : 'var(--youpez-text-default)',
                            borderBottomColor: 'var(--youpez-border)'
                        },
                        'tbody tr'         : {
                            borderBottomColor: 'var(--youpez-border)'
                        },
                        'ol[type="A" s]'   : false,
                        'ol[type="a" s]'   : false,
                        'ol[type="I" s]'   : false,
                        'ol[type="i" s]'   : false
                    }
                },
                sm     : {
                    css: {
                        code : {
                            fontSize: '1em'
                        },
                        pre  : {
                            fontSize: '1em'
                        },
                        table: {
                            fontSize: '1em'
                        }
                    }
                }
            })
        }
    },
    corePlugins: {
        appearance        : false,
        container         : false,
        float             : false,
        clear             : false,
        placeholderColor  : false,
        placeholderOpacity: false,
        verticalAlign     : false
    },
    plugins    : [

        // Fuse - Tailwind plugins
        require(path.resolve(__dirname, ('src/@youpez/tailwind/plugins/utilities'))),
        require(path.resolve(__dirname, ('src/@youpez/tailwind/plugins/icon-size'))),
        require(path.resolve(__dirname, ('src/@youpez/tailwind/plugins/theming')))({themes}),

        // Other third party and/or custom plugins
        require('@tailwindcss/typography')({modifiers: ['sm', 'lg']}),
        require('@tailwindcss/line-clamp'),
        require('flowbite/plugin')
        // require("tw-elements/dist/plugin.cjs")
    ]
};

module.exports = config;
