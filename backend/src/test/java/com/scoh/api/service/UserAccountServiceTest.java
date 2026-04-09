package com.scoh.api.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

import com.scoh.api.domain.Role;
import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.AdminUserCreateRequest;
import com.scoh.api.dto.UserStatusUpdateRequest;
import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.repository.UserAccountRepository;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    @InjectMocks
    private UserAccountService userAccountService;

    @Test
    void shouldBlockAdminFromRemovingOwnAdminRole() {
        UserAccount user = new UserAccount();
        user.setId("u1");
        user.setRoles(Set.of(Role.ADMIN, Role.USER));

        when(userAccountRepository.findById("u1")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userAccountService.updateRoles("u1", Set.of(Role.USER), "u1"))
                .isInstanceOf(ForbiddenOperationException.class);

        verify(userAccountRepository, never()).save(user);
    }

    @Test
    void shouldCreateAdminManagedUser() {
        AdminUserCreateRequest request = new AdminUserCreateRequest(
                "new.user@example.com",
                "New User",
                null,
                Set.of(Role.USER, Role.TECHNICIAN));

        UserAccount saved = new UserAccount();
        saved.setId("u2");
        saved.setEmail("new.user@example.com");
        saved.setFullName("New User");
        saved.setRoles(Set.of(Role.USER, Role.TECHNICIAN));

        when(userAccountRepository.findByEmailIgnoreCase("new.user@example.com")).thenReturn(Optional.empty());
        when(userAccountRepository.save(org.mockito.ArgumentMatchers.any(UserAccount.class))).thenReturn(saved);

        userAccountService.createUser(request, "admin-1");
    }

    @Test
    void shouldBlockAdminFromDeactivatingOwnAccount() {
        UserAccount user = new UserAccount();
        user.setId("u1");
        user.setRoles(Set.of(Role.ADMIN, Role.USER));
        user.setActive(true);

        when(userAccountRepository.findById("u1")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userAccountService.updateUserStatus("u1", new UserStatusUpdateRequest(false), "u1"))
                .isInstanceOf(ForbiddenOperationException.class);
    }
}
