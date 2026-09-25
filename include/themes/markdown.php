<?php
/**
 * Markdown compatibility helpers for HTML containers such as <details>.
 */

function nicen_markdown_table_row( $line ) {
	$line = trim( $line );
	if ( $line === '' || strpos( $line, '|' ) === false ) {
		return false;
	}

	$line  = trim( $line, "| \t" );
	$cells = preg_split( '/\s*\|\s*/', $line );
	$cells = array_map( 'trim', $cells );

	return count( $cells ) > 0 ? $cells : false;
}

function nicen_markdown_table_separator( $line ) {
	$cells = nicen_markdown_table_row( $line );
	if ( ! is_array( $cells ) ) {
		return false;
	}

	foreach ( $cells as $cell ) {
		if ( ! preg_match( '/^:?-{3,}:?$/', trim( $cell ) ) ) {
			return false;
		}
	}

	return true;
}

function nicen_render_markdown_table( $header, $rows ) {
	$column_count = count( $header );
	$html = '<div class="markdown-table-wrap"><table><thead><tr>';

	foreach ( $header as $cell ) {
		$html .= '<th>' . esc_html( $cell ) . '</th>';
	}
	$html .= '</tr></thead><tbody>';

	foreach ( $rows as $row ) {
		$row  = array_pad( array_slice( $row, 0, $column_count ), $column_count, '' );
		$html .= '<tr>';
		foreach ( $row as $cell ) {
			$html .= '<td>' . esc_html( $cell ) . '</td>';
		}
		$html .= '</tr>';
	}

	return $html . '</tbody></table></div>';
}

/** Convert plain Markdown tables left inside <details> by some Markdown parsers. */
function nicen_render_details_markdown_tables( $content ) {
	if ( strpos( $content, '<details' ) === false || strpos( $content, '|' ) === false ) {
		return $content;
	}

	return preg_replace_callback( '/<details\b([^>]*)>(.*?)<\/details>/is', function ( $match ) {
		$body  = $match[2];
		$lines = preg_split( '/\r\n|\r|\n/', $body );
		$out   = [];

		for ( $i = 0, $count = count( $lines ); $i < $count; $i++ ) {
			$header = nicen_markdown_table_row( $lines[ $i ] );
			if ( ! is_array( $header ) || $i + 1 >= $count || ! nicen_markdown_table_separator( $lines[ $i + 1 ] ) ) {
				$out[] = $lines[ $i ];
				continue;
			}

			$rows = [];
			$i += 2;
			while ( $i < $count ) {
				$row = nicen_markdown_table_row( $lines[ $i ] );
				if ( ! is_array( $row ) ) {
					$i--;
					break;
				}
				$rows[] = $row;
				$i++;
			}

			$out[] = nicen_render_markdown_table( $header, $rows );
		}

		return '<details' . $match[1] . '>' . implode( "\n", $out ) . '</details>';
	}, $content );
}

add_filter( 'the_content', 'nicen_render_details_markdown_tables', 999 );
