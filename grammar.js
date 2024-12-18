module.exports = grammar({
  name: "mmfml",
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
        prec(1, $.simple_marked_text),
        $.metadata_tag
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
      $.quote
    ))),

    inline_code: $ => seq(
      alias(token.immediate(seq("$", optional(repeat1(/\w/)), "$",)), $.inline_code_start),
      alias(repeat1(/[^\$\n]/), $.code),
      alias("$$", $.inline_code_end)
    ),

    metadata_tag: $ => prec.left(seq(
      ">metadata\n",
      repeat1(
        seq(
          seq(alias($.plain, $.metadata_key), ":"),
          alias($.plain, $.metadata_value),
          "\n",
        )
      ),
      "<\n"
    )),

    header: $ => $._header,

    sof_header: $ => alias($._sof_header, $.header),

    list: $ => token.immediate(
      seq(
        "\n",
        repeat(/\s/),
        choice(
          choice("-", "•", "*", "+"),
          seq(
            repeat1(/\w/),
            choice(".", "\x29") //29 is close paren
          ),
        ),
        /\s/,
      )
    ),

    divider: $ => token.immediate(
      seq(
        optional(choice("<", "|", "├", "┣")),
        repeat1(
          seq(
            /[=\-+_:—–‗‾━─~]/,
            /[=\-+_:—–‗‾━─~]/,
            repeat1(/[=\-+_:—–‗‾━─~]/)
            // repeat1(/[=\-\+_:]+/),
          )
        ),
        optional(choice(">", "|", "┤", "┫"))
      )
    ),

    footnote_name_text: $ => repeat1(/[A-Za-z0-9\*\+\-_]/),
    footnote_block: $ => seq(
      alias(seq(
        "\n^[",
        alias($.footnote_name_text, $.footnote_block_name),
        "]:",
        /\s+/,
      ), $.footnote_start),
      // repeat1($.simple_marked_text),
      // seq(
      //   alias("\n[/", $.footnote_end),
      //   $.footnote_name_text,
      //   alias("]", $.footnote_end)
      // )
    ),

    esc: $ => seq(
      alias("\\", $.backslash),
      field("char", alias(/./, $.escaped_char))
    ),

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

    box: $ => seq("[", $.simple_marked_text, "]"),

    link: $ => seq(
      token.immediate(seq("|", repeat(" "))),
      alias(prec.left(repeat1(/[^|\n]/)), $.link_url),
      token.immediate(seq(repeat(" "), "|"))
    ),

    quote: $ => prec.left(seq(
      alias(/[\p{Initial_Punctuation}「]/, $.quote_start),
      repeat1(/[^\p{Final_Punctuation}」]/),
      alias(/[」\p{Final_Punctuation}]/, $.quote_end),
      optional(seq(
        alias(
          token.immediate(
            seq(
              /[\s\n]*/,
              choice("–", "—", "~", "-"),
            )
          ),
          $.quote_author_indicator,
        ),
        alias(/[^\n]+/, $.quote_author)
      )))
    ),

    bold: $ => seq(alias("*", $.bold_start), $.simple_marked_text, alias("*", $.bold_end)),
    italic: $ => seq(alias("(/", $.italic_start), $.simple_marked_text, alias("/)", $.italic_end)),
    strikethrough: $ => seq(alias("~", $.strikethrough_start), $.simple_marked_text, alias("~", $.strikethrough_end)),
    underline: $ => seq(alias("_", $.underline_start), $.simple_marked_text, alias("_", $.underline_end)),
    pre_sample: $ => seq(alias("`", $.pre_sample_start), /[^`]+/, alias("`", $.pre_sample_end)),
    higlight: $ => seq(alias("+", $.higlight_start), $.simple_marked_text, alias("+", $.higlight_end)),
    anchor: $ => seq(alias("#", $.anchor_start), $.simple_marked_text, alias("#", $.anchor_end)),

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
              alias(
              repeat1(/\P{Letter}/),
              $.non_word
              )
            )
          )
        )
      )
    ),
    // simple_text: $ => /[^\n=]+/
  },
})
