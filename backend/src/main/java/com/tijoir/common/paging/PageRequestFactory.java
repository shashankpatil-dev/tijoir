package com.tijoir.common.paging;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public final class PageRequestFactory {
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private PageRequestFactory() {
    }

    public static PageRequest create(Integer page, Integer size, Sort sort) {
        int normalizedPage = page == null ? DEFAULT_PAGE : Math.max(page, 0);
        int normalizedSize = size == null ? DEFAULT_SIZE : Math.min(Math.max(size, 1), MAX_SIZE);
        return PageRequest.of(normalizedPage, normalizedSize, sort);
    }
}
