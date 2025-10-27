
const basic_space = /[\p{Space_Separator}]/

module.exports = grammar({
  name: "mmfml",

  extras: $ => [basic_space, /\s/],

  externals: $ => [
    $._code_block_start,
    $._code_block_end,
    $._header,
    $._sof_header,
  ],
  rules: {
    source_file: $ => seq(
      optional($.sof_header),
      repeat1(choice(
        $.header,
        $.footnote_block,
        prec(10, $.code_block),
        $.list,
        $.line_break,
        prec(1, $.simple_marked_text),
      ))
    ),

    simple_marked_text: $ => prec.left(repeat1(choice(
      $.divider,
      $.bold,
      $.italic,
      $.strikethrough,
      $.underline,
      $.pre_sample,
      $.link,
      $.box,
      $.higlight,
      $.footnote_ref,
      $.anchor,
      $.plain,
      $.esc,
      $.inline_code,
      $.quote,
      $.hidden,
      $.label
    ))),

    inline_code: $ => seq(
      alias(token.immediate(seq("$", optional(repeat1(/\w/)), "$",)), $.inline_code_start),
      alias(repeat1(/[^\$\n]/), $.code),
      alias("$$", $.inline_code_end)
    ),

    header: $ => $._header,

    sof_header: $ => alias($._sof_header, $.header),

    list: $ => token.immediate(
      seq(
        //prevents the stupidity of this. (s.) being a list
        /\n/,
        repeat(/\s/),
        //END prevention
        choice(
          choice("-", "•", "*", "+"),
          seq(
            choice(
              repeat1(/\p{Number}/),
              /\p{Letter}/,
            ),
            choice(".", "\x29") //29 is close paren
          ),
        ),
        //there must be a space after the marker
        /\s+/
      )
    ),

    divider: $ => token.immediate(
      seq(
        optional(choice("<", "|", "├", "┣")),
        choice(
          repeat1(
            seq("##", repeat1("#"))
          ),
          repeat1(
            seq("==", repeat1("="))
          ),
          repeat1(
            //at least 4 dots because ... is ellipses
            seq("...", repeat1("."))
          ),
          repeat1(
            seq("--", repeat1("-"))
          ),
          repeat1(
            seq("++", repeat1("+"))
          ),
          repeat1(
            seq("__", repeat1("_"))
          ),
          repeat1(
            seq("::", repeat1(":"))
          ),
          repeat1(
            seq("——", repeat1("—"))
          ),
          repeat1(
            seq("––", repeat1("–"))
          ),
          repeat1(
            seq("‗‗", repeat1("‗"))
          ),
          repeat1(
            seq("‾‾", repeat1("‾"))
          ),
          repeat1(
            seq("━━", repeat1("━"))
          ),
          repeat1(
            seq("──", repeat1("─"))
          ),
          repeat1(
            seq("~~", repeat1("~"))
          )
        ),
        optional(choice(">", "|", "┤", "┫"))
      )
    ),

    footnote_name_text: $ => repeat1(/[A-Za-z0-9\*\+\-_]/),
    footnote_block: $ =>
      seq(
        alias("^[", $.footnote_start),
        alias($.footnote_name_text, $.footnote_block_name),
        alias("]:", $.footnote_end),
      ),

    esc: $ => prec(10, /\\[^\n\p{Letter}]/),

    code_block: $ => seq(
      alias($._code_block_start, $.code_block_start),
      choice(
        field("language", alias(token.immediate(/[A-Za-z0-9]+\n/), $.language)),
        token.immediate(/\n/)
      ),
      alias(repeat1(/.+/), $.code_text),
      alias($._code_block_end, $.code_block_end)
    ),

    footnote_ref: $ => seq(
      alias("^[", $.footnote_start),
      $.footnote_name_text,
      alias("]", $.footnote_end)
    ),

    box: $ => seq("[", optional($.simple_marked_text), "]"),

    link: $ => seq(
      //spaces prevent the spaces from being counted as the link url
      seq("|", repeat(basic_space)),
      alias(repeat1(/./), $.link_url),
      "|"
    ),

    quote: $ => prec.right(
      seq(
        alias(choice(/[\p{Initial_Punctuation}「"]/, "``"), $.quote_start),
        alias(repeat1(/[^\p{Final_Punctuation}」"]/), $.quote_text),
        alias(choice(/[」"\p{Final_Punctuation}]/), $.quote_end),
        optional(
          seq(
            optional($.line_break),
            alias(
              choice("–", "—", "~", "-"),
              $.quote_author_indicator,
            ),
            alias(/[^\n]+/, $.quote_author)
          )
        ),
      )
    ),

    hidden: $ => seq(
      alias("||", $.hidden_start),
      $.simple_marked_text,
      alias("||", $.hidden_end)
    ),

    bold: $ => seq(
      alias("*", $.bold_start),
      $.simple_marked_text,
      alias("*", $.bold_end)
    ),

    label: $ => seq(
      alias("<", $.label_start),
      $.plain,
      alias(">", $.label_end)
    ),

    italic: $ => prec(10,
      choice(
        seq(
          alias("(/", $.italic_start),
          $.simple_marked_text,
          alias("/)", $.italic_end)
        ),
        seq(
          alias("/*", $.italic_start),
          $.simple_marked_text,
          alias("*/", $.italic_end),
        ),
        seq(
          alias(" /", $.italic_start),
          $.simple_marked_text,
          alias("/ ", $.italic_end),
        )
      ),
    ),
    strikethrough: $ => seq(
      alias("~", $.strikethrough_start),
      $.simple_marked_text,
      alias("~", $.strikethrough_end)
    ),
    underline: $ => seq(
      alias("_", $.underline_start),
      $.simple_marked_text,
      alias("_", $.underline_end)
    ),
    pre_sample: $ => seq(
      alias("`", $.pre_sample_start),
      alias(/[^`]+/, $.pre_sample_text),
      alias("`", $.pre_sample_end)
    ),
    higlight: $ => seq(
      alias("+", $.higlight_start),
      $.simple_marked_text,
      alias("+", $.higlight_end)
    ),
    anchor: $ => seq(
      alias("#", $.anchor_start),
      $.simple_marked_text,
      alias("#", $.anchor_end)
    ),

    line_break: $ => "\n",

    non_word: $ => prec.right(repeat1(/\P{Letter}/)),

    plain: $ => prec.right(
      repeat1(
        choice(
          /\s/,
          //this nonsense here lets the user select words and
          //highlight specific words as special if they want
          //basically it creates a node that is whitespace diliminated
          prec.right(
            choice(
              alias(
                repeat1(/\p{Letter}/),
                $.word
              ),
              $.non_word,
            )
          )
        )
      )
    ),
    // simple_text: $ => /[^\n=]+/
  },
})
