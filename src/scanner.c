#include "./tree_sitter/parser.h"
#include <stdlib.h>
#include <wctype.h>

typedef struct {
  uint8_t level_count;
} Scanner;

enum TokenType {
    CODE_BLOCK_START,
    CODE_BLOCK_END,

    HEADER
};

static inline void consume(TSLexer *lexer) {
    lexer->advance(lexer, false);
}

static inline void skip(TSLexer *lexer) {
    lexer->advance(lexer, true);
}

static inline bool consume_char(char c, TSLexer *lexer) {
  if (lexer->lookahead != c) {
    return false;
  }

  consume(lexer);
  return true;
}

static inline uint8_t consume_and_count_char(char c, TSLexer *lexer) {
  uint8_t count = 0;
  while (lexer->lookahead == c) {
    ++count;
    consume(lexer);
  }
  return count;
}

void* tree_sitter_mmfml_external_scanner_create() {
    Scanner* scanner = calloc(1, sizeof(Scanner));
    return scanner;
}

void tree_sitter_mmfml_external_scanner_destroy(void* payload) {
    Scanner* scanner = (Scanner*)payload;
    free(scanner);
}

unsigned tree_sitter_mmfml_external_scanner_serialize(void* payload, char* buf) {
    Scanner* scanner = (Scanner*)payload;
    buf[0] = (char)scanner->level_count;
    return 1;
}

void tree_sitter_mmfml_external_scanner_deserialize(void* payload, const char* buffer, unsigned length) {
    Scanner* scanner = (Scanner*)payload;

    if(length == 0) return;

    scanner->level_count = (uint8_t)buffer[0];
}

static bool scan_block_start(Scanner* scanner, TSLexer *lexer) {
    if(consume_char('>', lexer)) {
        uint8_t level = consume_and_count_char('>', lexer);

        if(level > 0) {
            scanner->level_count = level;
        }

        //disallow whitespace after > unless it is a new line
        //this prevents `x > y` being treated as a codeblock start
        //or even `x --> y`
        if(iswspace(lexer->lookahead) && lexer->lookahead != '\n') {
            return false;
        }

        return true;
    }
    return false;
}

static bool scan_block_end(Scanner* scanner, TSLexer* lexer) {
    while(iswspace(lexer->lookahead)) {
        skip(lexer);
    }
    if(consume_char('<', lexer)) {
        uint8_t level = consume_and_count_char('<', lexer);

        if(level == 0 && scanner->level_count == 0) {
            return true;
        }
        if(scanner->level_count == level) {
            return true;
        }
    }
    return false;
}

static bool scan_header(Scanner* scanner, TSLexer* lexer) {
    bool foundNewLine = false;
    while(iswspace(lexer->lookahead)) {
        if(lexer->lookahead == '\n') {
            foundNewLine = true;
        }
        skip(lexer);
    }

    //make sure the header is the first non-whitespace thing on the line
    if(!foundNewLine) {
        return false;
    }

    if(lexer->lookahead != '=') {
        return false;
    }

    uint8_t level = consume_and_count_char('=', lexer);

    while(lexer->lookahead != '\n') {
        if(lexer->lookahead == '=') {
            uint8_t endEqCount = consume_and_count_char('=', lexer);
            if(endEqCount == level) {
                return true;
            }
        } else {
            consume(lexer);
        }
    }
    return true;
}

bool tree_sitter_mmfml_external_scanner_scan(void *payload, TSLexer* lexer, const bool *valid_symbols) {
    Scanner *scanner = (Scanner*)payload;

    if(valid_symbols[CODE_BLOCK_END] && scan_block_end(scanner, lexer)) {
        scanner->level_count = 0;
        lexer->result_symbol = CODE_BLOCK_END;
        return true;
    }

    if(valid_symbols[CODE_BLOCK_START] && scan_block_start(scanner, lexer)) {
        lexer->result_symbol = CODE_BLOCK_START;
        return true;
    }

    if(valid_symbols[HEADER] && scan_header(scanner, lexer)) {
        lexer->result_symbol = HEADER;
        return true;
    }

    return false;
}
